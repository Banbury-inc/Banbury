import axios from "axios";

import { getDeviceInfo } from "./getDeviceInfo";
import { webSocketService } from "../websockets";
import { CONFIG } from "../config/config";



// Function to get total requests processed
export async function downloadFile(username: string, fileInfo: any): Promise<Blob | null> {

  // get device id from fileInfo
  const device_id = fileInfo.device_id;

  // get file id from fileInfo
  const file_id = fileInfo._id;

  // get device info from device id
  const device_info = await getDeviceInfo(username, device_id);
  console.log(device_info);

  // look to see if device is online
  const online = device_info.online;
  // if device is online, send request (websocket) to download file
  if (online) {
    console.log("Device is online");

    try {
      // Wait for WebSocket connection with timeout
      const connectionTimeout = 5000; // 5 seconds timeout
      await Promise.race([
        webSocketService.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('WebSocket connection timeout')), connectionTimeout)
        )
      ]);

      // Check if connection is actually established
      if (webSocketService.isConnected()) {

        webSocketService.send({
          message: "Initiate live data connection",
          username: username,
          requesting_device_name: "Banbury-Website",
          run_device_info_loop: CONFIG.run_device_info_loop,
          run_device_predictions_loop: CONFIG.run_device_predictions_loop,
        });

        // Create a Promise that will resolve when the file transfer is complete
        const fileDownloadPromise = new Promise((resolve, reject) => {
          let chunks: Uint8Array[] = [];
          
          const handleFileData = (event: MessageEvent) => {
            // Add detailed logging for all incoming messages
            console.log("=== WebSocket Message Received ===");
            console.log("Raw event:", event);
            console.log("Message type:", typeof event.data);
            
            const data = event.data;
            
            if (data instanceof ArrayBuffer) {
              // Handle binary chunk
              console.log("Received binary chunk of size:", data.byteLength, "bytes");
              chunks.push(new Uint8Array(data));
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

        // Wait for the file download to complete
        const fileBlob = await fileDownloadPromise;
        return fileBlob as Blob;
      } else {
        throw new Error('WebSocket connection failed');
      }
    } catch (error) {
      console.error('Failed to send download request:', error);
      throw error;
    }
  } else {
    console.log("Device is offline");
    return null;
  }
}
