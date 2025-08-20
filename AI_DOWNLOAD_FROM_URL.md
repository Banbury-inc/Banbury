# AI Download from URL Tool

The AI assistant now has the ability to download files from URLs and upload them to your cloud workspace using the `download_from_url` tool.

## How it works

When you ask the AI to download a file from a URL, it will:

1. Download the file from the provided URL
2. Automatically determine the file type and extension
3. Upload the file to your S3 cloud storage
4. Store it in the `uploads` folder by default
5. Provide you with the file information and S3 URL
6. **Automatically refresh the file tree** so you can immediately see the new file

## Usage Examples

### Basic Usage
```
"Download the file from https://example.com/document.pdf"
```

### With Custom File Name
```
"Download the file from https://example.com/document.pdf and save it as 'my_document.pdf'"
```

### With Custom Path
```
"Download the file from https://example.com/data.csv and save it in the 'projects/analysis' folder"
```

## Tool Parameters

The `download_from_url` tool accepts the following parameters:

- **url** (required): The URL of the file to download
- **fileName** (optional): Custom file name (if not provided, will extract from URL)
- **filePath** (optional): Custom file path (default: 'uploads')
- **fileParent** (optional): Parent directory (default: 'uploads')

## Supported File Types

The tool can handle various file types including:

- **Documents**: PDF, DOC, DOCX, TXT, HTML, MD
- **Images**: JPG, PNG, GIF, WebP, SVG
- **Audio**: MP3, WAV, OGG
- **Video**: MP4, WebM, OGV
- **Data**: JSON, XML, CSV, XLS, XLSX
- **Archives**: ZIP
- **And more**: Any file type that can be downloaded via HTTP

## Error Handling

The tool will provide clear error messages if:

- The URL is invalid or inaccessible
- The file cannot be downloaded (404, 403, etc.)
- There are authentication issues
- The upload to S3 fails

## Security Notes

- The AI can only download publicly accessible files
- Files are downloaded directly to the server and then uploaded to S3
- The original source URL is stored in the file metadata for reference
- Large files may take time to download and upload

## Example AI Conversation

**User**: "Can you download the latest version of the project documentation from https://github.com/example/repo/raw/main/docs/README.md?"

**AI**: "I'll download the README.md file from that URL for you."

*[AI uses the download_from_url tool]*

**AI**: "I've successfully downloaded the README.md file from the GitHub repository and uploaded it to your cloud workspace. The file is now available in your uploads folder and can be accessed through your file browser."
