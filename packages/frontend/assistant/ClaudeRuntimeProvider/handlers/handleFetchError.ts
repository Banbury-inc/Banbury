export async function handleFetchError({ response }: { response: Response }): Promise<string> {
  const errorText = await response.text();
  let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  
  // Try to parse error details from response
  try {
    const errorData = JSON.parse(errorText);
    if (errorData.error) {
      errorMessage = errorData.error;
    }
  } catch {
    // Use default error message if parsing fails
  }
  
  return errorMessage;
}

