from ultralytics import YOLO

# Load YOLOv8n model
model = YOLO("model/yolov8n.pt")

# Run inference on test image
results = model("test_images/test.jpg")

# Save output with detections
results[0].save("test_images/output.jpg")

print("✅ Detection complete! Check test_images/output.jpg")
