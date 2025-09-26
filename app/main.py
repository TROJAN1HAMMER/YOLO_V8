import os
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO

# Setup
app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
RESULTS_DIR = BASE_DIR / "results"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# Serve results directory as static files
app.mount("/results", StaticFiles(directory=RESULTS_DIR), name="results")

# Load YOLO model once
model = YOLO("yolov8n.pt")


@app.get("/")
def root():
    return {"message": "YOLO API is running 🚀"}


@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    try:
        # Save uploaded file
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        file_path = UPLOAD_DIR / f"{timestamp}_{file.filename}"
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Run YOLO prediction (save annotated image in results/runs/)
        results = model.predict(
            source=str(file_path),
            save=True,
            project=str(RESULTS_DIR),
            name="runs",
            exist_ok=True
        )

        # Extract detections
        detections = []
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            confidence = float(box.conf[0])
            detections.append({
                "label": label,
                "confidence": round(confidence, 3),
                "box": box.xyxy[0].tolist()  # [x1, y1, x2, y2]
            })

        # Find the annotated result file
        save_dir = Path(results[0].save_dir)
        # YOLO saves with original filename
        result_file = save_dir / file_path.name
        PUBLIC_HOST = "http://13.218.84.170:8000"

        image_url = f"{PUBLIC_HOST}/results/{save_dir.name}/{file_path.name}"
        response = {
            "filename": file.filename,
            "detections": detections,
            "image_url": image_url
        }

        return JSONResponse(content=response)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
