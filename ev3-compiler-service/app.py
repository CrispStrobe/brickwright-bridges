import base64
import os
import subprocess
import tempfile

import gradio as gr
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Path to the lmsasm binary
LMSASM_PATH = "./lmsasm-binary"


# ==========================================
# 1. CORE COMPILATION LOGIC (Shared)
# ==========================================
def compile_core(lms_code):
    """
    Compiles LMS code to RBF.
    Returns: (rbf_path, base64_string, size_in_bytes)
    Raises Exception on failure.
    """
    if not lms_code or not lms_code.strip():
        raise ValueError("No code provided")

    # Create temporary files
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".lms", delete=False, encoding="utf-8"
    ) as lms_file:
        lms_file.write(lms_code)
        lms_path = lms_file.name

    lms_filename = os.path.basename(lms_path)
    rbf_filename = lms_filename.replace(".lms", ".rbf")
    rbf_path = os.path.join(os.getcwd(), rbf_filename)

    try:
        # Run compiler
        result = subprocess.run(
            [LMSASM_PATH, "-output", rbf_path, lms_path],
            capture_output=True,
            text=True,
            timeout=10,
        )

        if result.returncode != 0:
            raise RuntimeError(result.stderr or result.stdout)

        if not os.path.exists(rbf_path):
            raise RuntimeError("RBF file was not created by lmsasm")

        # Read the compiled bytecode
        with open(rbf_path, "rb") as f:
            rbf_data = f.read()

        rbf_b64 = base64.b64encode(rbf_data).decode("utf-8")
        return rbf_path, rbf_b64, len(rbf_data)

    finally:
        # Cleanup temporary LMS file
        if os.path.exists(lms_path):
            try:
                os.unlink(lms_path)
            except Exception:
                pass
        # Cleanup local RBF file (we return the path or data, but clean up the working dir copy)
        # Note: If we return the path for Gradio download, we can't delete it immediately here.
        # But for API usage, we send base64.
        # For safety in this hybrid script, we won't delete rbf_path here immediately.


# ==========================================
# 2. GRADIO WRAPPER (For the UI)
# ==========================================
def gradio_compile(code):
    try:
        path, b64, size = compile_core(code)

        # Move file to temp for safe download
        dl_path = os.path.join(tempfile.gettempdir(), "compiled.rbf")
        with open(dl_path, "wb") as f:
            f.write(base64.b64decode(b64))

        # Clean up the working directory file
        if os.path.exists(path):
            os.unlink(path)

        status = f"✅ Success! Size: {size} bytes\n💡 Ready to upload."
        return dl_path, b64, status
    except Exception as e:
        return None, None, f"❌ Error: {str(e)}"


# ==========================================
# 3. FASTAPI SERVER SETUP
# ==========================================
app = FastAPI()

# Enable CORS (Allows TurboWarp to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Define request model for Scratch
class CompileRequest(BaseModel):
    code: str


# --- THE FIX: A Custom Endpoint for your Extension ---
@app.post("/compile")
async def api_compile(request: CompileRequest):
    try:
        # 1. Compile
        path, b64, size = compile_core(request.code)

        # 2. Cleanup file (API only needs base64)
        if os.path.exists(path):
            os.unlink(path)

        # 3. Return JSON
        return {
            "success": True,
            "base64": b64,
            "message": f"Compiled successfully ({size} bytes)",
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ==========================================
# 4. BUILD UI AND LAUNCH
# ==========================================

# Example LMS code
EXAMPLE_CODE = """vmthread MAIN
{
  // Declare variables
  DATA8 Layer
  DATA8 Port
  DATA8 Power
  DATA32 TimeUp
  DATA32 TimeRun
  DATA32 TimeDown
  DATA8 Brake

  // Initialize values
  MOVE8_8(0, Layer)
  MOVE8_8(0x01, Port)
  MOVE8_8(75, Power)
  MOVE32_32(50, TimeUp)
  MOVE32_32(2000, TimeRun)
  MOVE32_32(50, TimeDown)
  MOVE8_8(1, Brake)

  // Run motor
  OUTPUT_TIME_POWER(Layer, Port, Power, TimeUp, TimeRun, TimeDown, Brake)
}
"""

with gr.Blocks(title="EV3 LMS Compiler") as demo:
    gr.Markdown("# 🤖 EV3 LMS Compiler")
    with gr.Row():
        inp = gr.Code(label="LMS Code", value=EXAMPLE_CODE, lines=15)
        btn = gr.Button("Compile", variant="primary")
    with gr.Row():
        out_file = gr.File(label="Download RBF")
        out_txt = gr.Textbox(label="Base64")
        out_stat = gr.Textbox(label="Status")

    btn.click(fn=gradio_compile, inputs=[inp], outputs=[out_file, out_txt, out_stat])

# Mount Gradio on the root path
app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    if not os.path.exists(LMSASM_PATH):
        print(f"⚠️  WARNING: lmsasm binary not found at {LMSASM_PATH}")

    print("🚀 Server running on http://127.0.0.1:7860")
    print("   Endpoint for Scratch: http://127.0.0.1:7860/compile")

    uvicorn.run(app, host="0.0.0.0", port=7860)
