import axios from "axios";

import { getDeviceInfo } from "./getDeviceInfo";



// Function to get total requests processed
export async function downloadFile(username: string, fileInfo: any): Promise<any | null> {

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

    console.log("Sending request to download file");
    // send request to download file

  } else {
    console.log("Device is offline");
  }
  return;

}
