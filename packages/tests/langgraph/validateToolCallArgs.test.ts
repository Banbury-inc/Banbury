import { ensureToolArguments, getMissingToolArguments } from "../../pages/api/assistant/langgraph-stream/handlers/validateToolCallArgs"

describe("validateToolCallArgs", () => {
  it("returns an empty list for tools without required arguments", () => {
    expect(getMissingToolArguments("stagehand_close", {})).toEqual([])
  })

  it("identifies missing required arguments", () => {
    expect(getMissingToolArguments("stagehand_goto", {})).toEqual(["url"])
  })

  it("ignores arguments that are present", () => {
    expect(getMissingToolArguments("generate_image", { prompt: "a skyline" })).toEqual([])
  })

  it("throws a descriptive error when ensureToolArguments detects missing values", () => {
    expect(() => ensureToolArguments("stagehand_extract", { instruction: "Collect data" })).toThrowError(
      expect.objectContaining({
        name: "MissingToolArgumentsError",
        toolName: "stagehand_extract",
        missingArgs: ["schema"],
        message: expect.stringContaining("stagehand_extract"),
      })
    )
  })

  it("allows execution when arguments are satisfied", () => {
    expect(() => ensureToolArguments("create_file", { fileName: "notes.docx", filePath: "docs/notes.docx", content: "Hello" })).not.toThrow()
  })
})


