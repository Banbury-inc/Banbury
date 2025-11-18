import axios from "axios";

import { CONFIG } from "../config/config";





// Function to get total requests processed
export async function getFileInfo(username: string | undefined, file_id: string | undefined): Promise<any | null> {
  try {
    const response = await axios.get(`${CONFIG.url}/files/get_file_info/${username}/${file_id}`);

    if (!response.data) {
      return null;
    }

    const fileInfo = response.data.file_info;
    return fileInfo;
  } catch (error) {
    console.error('Error fetching file info:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    return null;
  }
}
