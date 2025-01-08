import axios from "axios";





// Function to get total requests processed
export async function getDeviceInfo(username: string | undefined, device_id: string | undefined): Promise<any | null> {
  try {
    const response = await axios.get(`http://localhost:8080/devices/get_single_device_info/${username}/${device_id}`);

    console.log(response)


    const deviceInfo = response.data.device_info;
    return deviceInfo;
  } catch (error) {
    console.error('Error fetching device info:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
  }
}
