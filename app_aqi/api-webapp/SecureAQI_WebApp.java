import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.KeySpec;
import java.util.Base64;
import java.util.Date;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.locks.ReentrantLock;

public class SecureAQI_WebApp {

    // --- Cryptographic Constants ---
    private static final String KEY_DERIVATION_ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final String CIPHER_ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final String KEY_TYPE = "AES";
    private static final int KEY_LENGTH = 256;
    private static final int IV_LENGTH_BYTES = 16; // AES block size
    private static final int SALT_LENGTH_BYTES = 16;
    private static final int ITERATION_COUNT = 65536;

    // --- File Paths ---
    private static final Path ENCRYPTED_LOG_FILE = Paths.get("aqi_log.enc");
    private static final Path SALT_FILE = Paths.get("salt.bin");

    // --- Application State ---
    private static SecretKey secretKey;
    private static final ReentrantLock fileLock = new ReentrantLock();
    private static final AQISensor sensor = new SimulatedAQISensor();
    private static volatile double currentAqi = 0.0;
    private static volatile String currentStatus = "Initializing...";

    public static void main(String[] args) throws Exception {
        // --- Password Setup ---
        // In a real application, get this from a secure location, not hardcoded.
        char[] password = "sid1234".toCharArray();
        try {
            secretKey = getKeyFromPassword(password);
            System.out.println("Secret key derived successfully.");
        } catch (Exception e) {
            System.err.println("Failed to derive secret key: " + e.getMessage());
            return;
        }

        // --- Start Monitoring ---
        startMonitoringTask();

        // --- Setup Web Server ---
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/api/aqi", new AqiHandler());
        server.createContext("/api/log", new LogHandler());
        server.createContext("/", new StaticFileHandler());
        server.setExecutor(null); // creates a default executor
        server.start();
        System.out.println("Server started on port 8080");
    }

    /**
     * Derives a secret key from a password and salt.
     */
    private static SecretKey getKeyFromPassword(char[] password) throws NoSuchAlgorithmException, InvalidKeySpecException, IOException {
        byte[] salt;
        if (Files.exists(SALT_FILE)) {
            salt = Files.readAllBytes(SALT_FILE);
        } else {
            salt = new byte[SALT_LENGTH_BYTES];
            new SecureRandom().nextBytes(salt);
            Files.write(SALT_FILE, salt);
            System.out.println("No salt found. Generated and saved a new one.");
        }

        SecretKeyFactory factory = SecretKeyFactory.getInstance(KEY_DERIVATION_ALGORITHM);
        KeySpec spec = new PBEKeySpec(password, salt, ITERATION_COUNT, KEY_LENGTH);
        SecretKey derivedKey = factory.generateSecret(spec);
        return new SecretKeySpec(derivedKey.getEncoded(), KEY_TYPE);
    }

    /**
     * Starts the recurring timer task to read sensor data and log it securely.
     */
    private static void startMonitoringTask() {
        Timer monitoringTimer = new Timer("AQI-Monitor-Thread", true); // Daemon thread
        monitoringTimer.scheduleAtFixedRate(new TimerTask() {
            public void run() {
                try {
                    currentAqi = sensor.readAqi();
                    String timestamp = new Date().toString();
                    currentStatus = currentAqi > 150 ? "⚠️ HIGH POLLUTION" : "Normal";
                    String logEntry = String.format("[%s] AQI: %.1f [%s]", timestamp, currentAqi, currentStatus);

                    String encryptedEntry = encrypt(logEntry, secretKey);

                    fileLock.lock();
                    try (BufferedWriter writer = Files.newBufferedWriter(ENCRYPTED_LOG_FILE, StandardCharsets.UTF_8, java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND)) {
                        writer.write(encryptedEntry);
                        writer.newLine();
                    } finally {
                        fileLock.unlock();
                    }
                } catch (Exception ex) {
                    System.err.println("ERROR in monitoring task: " + ex.getMessage());
                }
            }
        }, 0, 5000); // Log every 5 seconds
    }

    /**
     * Encrypts a plaintext string.
     */
    private static String encrypt(String plainText, SecretKey key) throws Exception {
        byte[] iv = new byte[IV_LENGTH_BYTES];
        new SecureRandom().nextBytes(iv);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        Cipher cipher = Cipher.getInstance(CIPHER_ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, key, ivSpec);
        byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

        ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + encryptedBytes.length);
        byteBuffer.put(iv);
        byteBuffer.put(encryptedBytes);
        return Base64.getEncoder().encodeToString(byteBuffer.array());
    }

    // --- HTTP Handlers ---

    static class AqiHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            String response = String.format("{\"aqi\": %.1f, \"status\": \"%s\"}", currentAqi, currentStatus);
            sendResponse(t, response, "application/json");
        }
    }

    static class LogHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            fileLock.lock();
            try {
                if (Files.exists(ENCRYPTED_LOG_FILE)) {
                    byte[] fileBytes = Files.readAllBytes(ENCRYPTED_LOG_FILE);
                    sendResponse(t, fileBytes, "text/plain");
                } else {
                    sendResponse(t, "No log file found.", "text/plain", 404);
                }
            } finally {
                fileLock.unlock();
            }
        }
    }

    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            String requestedFile = t.getRequestURI().getPath().equals("/") ? "/index.html" : t.getRequestURI().getPath();
            Path filePath = Paths.get("." + requestedFile);

            if (Files.exists(filePath) && !Files.isDirectory(filePath)) {
                String contentType = "text/html";
                if (requestedFile.endsWith(".css")) contentType = "text/css";
                if (requestedFile.endsWith(".js")) contentType = "application/javascript";
                
                byte[] fileBytes = Files.readAllBytes(filePath);
                sendResponse(t, fileBytes, contentType);
            } else {
                sendResponse(t, "404 Not Found", "text/plain", 404);
            }
        }
    }
    
    private static void sendResponse(HttpExchange t, String response, String contentType) throws IOException {
        sendResponse(t, response, contentType, 200);
    }

    private static void sendResponse(HttpExchange t, String response, String contentType, int statusCode) throws IOException {
        sendResponse(t, response.getBytes(StandardCharsets.UTF_8), contentType, statusCode);
    }
    
    private static void sendResponse(HttpExchange t, byte[] responseBytes, String contentType) throws IOException {
        sendResponse(t, responseBytes, contentType, 200);
    }
    
    private static void sendResponse(HttpExchange t, byte[] responseBytes, String contentType, int statusCode) throws IOException {
        t.getResponseHeaders().set("Content-Type", contentType);
        t.getResponseHeaders().add("Access-Control-Allow-Origin", "*"); // For development
        t.sendResponseHeaders(statusCode, responseBytes.length);
        OutputStream os = t.getResponseBody();
        os.write(responseBytes);
        os.close();
    }
}

// --- Sensor Abstraction (remains the same) ---

interface AQISensor {
    double readAqi() throws Exception;
}

class SimulatedAQISensor implements AQISensor {
    private final SecureRandom random = new SecureRandom();

    @Override
    public double readAqi() {
        return 30 + random.nextDouble() * 150;
    }
}