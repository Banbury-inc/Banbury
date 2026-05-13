export async function handleFetchError({ response }: { response: Response }): Promise<string> {
  const errorText = await response.text();
  let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  
  // Try to parse error details from response
  try {
    const errorData = JSON.parse(errorText);
    const parts = [
      errorData.error,
      errorData.details,
      errorData.requestId ? `Request ID: ${errorData.requestId}` : undefined,
    ].filter((part) => typeof part === "string" && part.length > 0)

    if (parts.length > 0) {
      return parts.join("\n")
    }

    if (errorData.error) {
      errorMessage = errorData.error;
    }
  } catch {
    // Use default error message if parsing fails
    if (errorText) return `${errorMessage}\n${errorText.slice(0, 1000)}`
  }
  
  return errorMessage;
}

