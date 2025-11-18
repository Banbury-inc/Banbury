import { getDeviceInfo } from "./getDeviceInfo";
import { CONFIG } from "../config/config";
import { webSocketService } from "../websockets";

// Function to get total requests processed
export async function downloadFile(username: string | undefined, fileInfo: any, onProgress?: (step: number, error?: string) => void): Promise<Blob | null> {
  // Step 1: Getting device info
  onProgress?.(1);
  const device_id = fileInfo.device_id;

  // Step 2: Getting device info
  const device_info = await getDeviceInfo(username, device_id);
  onProgress?.(2);

  // Step 3: Checking if device is online
  const online = device_info.online;
  if (!online) {
    console.log("Device is offline");
    onProgress?.(2, "Device is offline"); // Report error at step 2
    return null;
  }
  onProgress?.(3);

  try {
    // Step 4: Sending download request
    await Promise.race([
      webSocketService.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000)
      )
    ]);
    onProgress?.(4);

    if (webSocketService.isConnected()) {
      webSocketService.send({
        message: "Initiate live data connection",
        username: username,
        requesting_device_name: "Banbury-Website",
        run_device_info_loop: CONFIG.run_device_info_loop,
        run_device_predictions_loop: CONFIG.run_device_predictions_loop,
      });

      // Step 5: Preparing file (waiting for completion)
      const fileDownloadPromise = new Promise((resolve, reject) => {
        const chunks: ArrayBuffer[] = [];
        
        const handleFileData = (event: MessageEvent) => {
          // Add detailed logging for all incoming messages
          console.log("=== WebSocket Message Received ===");
          console.log("Raw event:", event);
          console.log("Message type:", typeof event.data);
          
          const data = event.data;
          
          if (data instanceof ArrayBuffer) {
            // Handle binary chunk
            console.log("Received binary chunk of size:", data.byteLength, "bytes");
            chunks.push(data);
          } else {
            // Handle potential control messages
            const message = JSON.parse(data);
            console.log("Received JSON message:", message);
            if (message.message === 'File transfer complete') {
              console.log("Transfer complete! Total chunks received:", chunks.length);
              // Combine all chunks into a single Blob
              const blob = new Blob(chunks, { type: 'application/octet-stream' });
              webSocketService.removeEventListener('message', handleFileData);
              resolve(blob);
            } else if (message.type === 'transfer-error') {
              console.log("Transfer error received:", message.error);
              webSocketService.removeEventListener('message', handleFileData);
              reject(new Error(message.error || 'File transfer failed'));
            }
          }
        };

        // Add listener for incoming file data
        webSocketService.addEventListener('message', handleFileData);
        onProgress?.(5);

        // Send the initial download request
        webSocketService.send({
          message: "Download Request",
          username: username,
          file_name: fileInfo.file_name,
          file_path: fileInfo.file_path,
          requesting_device_name: device_info.device_name,
        });
        console.log("Request sent to download file");
      });

      const fileBlob = await fileDownloadPromise;
      return fileBlob as Blob;
    } else {
      throw new Error('WebSocket connection failed');
    }
  } catch (error) {
    console.error('Failed to send download request:', error);
    throw error;
  }
}
