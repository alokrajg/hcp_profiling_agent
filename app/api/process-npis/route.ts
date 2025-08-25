import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const npisJson = formData.get("npis") as string;
    const npis = JSON.parse(npisJson);

    if (!npis || npis.length === 0) {
      return NextResponse.json({ error: "No NPIs provided" }, { status: 400 });
    }

    // Create a temporary Python script to process the NPIs
    const tempScript = `
import sys
import os
import json

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), '..', '..', 'backend')
sys.path.append(backend_path)

try:
    from backend_data import process_npis_to_data
    
    npis = ${JSON.stringify(npis)}
    profiles = process_npis_to_data(npis)
    print(json.dumps(profiles))
except Exception as e:
    print(json.dumps([]))
    import traceback
    traceback.print_exc(file=sys.stderr)
`;

    const tempScriptPath = "./temp_process.py";
    require("fs").writeFileSync(tempScriptPath, tempScript);

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn("python3", [tempScriptPath], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PATH: `${process.cwd()}/backend/.venv/bin:${process.env.PATH}`,
          PYTHONPATH: `${process.cwd()}/backend`,
        },
      });

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", async (code) => {
        try {
          // Clean up temporary script
          if (require("fs").existsSync(tempScriptPath)) {
            require("fs").unlinkSync(tempScriptPath);
          }

          if (code !== 0) {
            console.error("Python script error:", stderr);
            // Return empty profiles instead of error to allow fallback
            return resolve(NextResponse.json({ profiles: [] }));
          }

          try {
            const profiles = JSON.parse(stdout.trim());
            resolve(NextResponse.json({ profiles }));
          } catch (parseError) {
            console.error("Error parsing Python output:", parseError);
            // Return empty profiles instead of error to allow fallback
            resolve(NextResponse.json({ profiles: [] }));
          }
        } catch (error) {
          console.error("Error processing results:", error);
          // Return empty profiles instead of error to allow fallback
          resolve(NextResponse.json({ profiles: [] }));
        }
      });

      pythonProcess.on("error", (error) => {
        console.error("Failed to start Python process:", error);
        resolve(
          NextResponse.json(
            { error: "Failed to start processing" },
            { status: 500 }
          )
        );
      });
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
