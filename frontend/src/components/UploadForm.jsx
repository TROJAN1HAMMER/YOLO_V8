import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const SIGNATURE_TEXT = "TROJAN1HAMMER";

async function createWatermarkedDataUrl(fileOrUrl, signature = SIGNATURE_TEXT) {
  // Accept either a File object or an existing image URL
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    const onload = () => {
      try {
        // Set canvas size (limit max dimension for performance)
        const maxDim = 1024;
        let w = img.width;
        let h = img.height;
        if (Math.max(w, h) > maxDim) {
          if (w >= h) {
            h = Math.round((maxDim / w) * h);
            w = maxDim;
          } else {
            w = Math.round((maxDim / h) * w);
            h = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");

        // Draw original image
        ctx.drawImage(img, 0, 0, w, h);

        // Watermark style
        const fontSize = Math.round(Math.max(w, h) / 18); // scale with image
        ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";

        // semi-transparent black box behind watermark for contrast
        const padding = Math.round(fontSize * 0.5);
        const textMetrics = ctx.measureText(signature);
        const txtW = textMetrics.width;
        const boxW = txtW + padding * 2;
        const boxH = fontSize + padding * 1.4;
        const x = w - 12; // margin from right
        const y = h - 12; // margin from bottom

        // draw rounded rect background
        const radius = 8;
        ctx.fillStyle = "rgba(0,0,0,0.40)"; // translucent black
        // rounded rect coordinates
        const bx = x - boxW;
        const by = y - boxH;
        roundRect(ctx, bx, by, boxW, boxH, radius);
        ctx.fill();

        // draw watermark text (slightly transparent light)
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fillText(signature, x - padding, y - padding * 0.25);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    const onerror = (e) => {
      reject(new Error("Image load error"));
    };

    img.onload = onload;
    img.onerror = onerror;

    if (fileOrUrl instanceof File) {
      // read file to dataURL then set src
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsDataURL(fileOrUrl);
    } else {
      // assume URL
      img.src = fileOrUrl;
    }
  });
}

// helper: rounded rect path for canvas
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function UploadForm() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // watermarked preview dataURL
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    setImage(f);
    setPreviewUrl(null);
    setDetections([]);
  };

  const handleUpload = async () => {
    if (!image) {
      toast.error("Please select an image first!");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", image);

      // send to backend
      const response = await axios.post("http://13.218.84.170:8000/predict/", formData);
      const { detections } = response.data;

      // create watermarked data url from original file (so local watermark is applied)
      const watermarked = await createWatermarkedDataUrl(image, SIGNATURE_TEXT);

      setPreviewUrl(watermarked);
      setDetections(detections);
      toast.success("Detection successful!");
    } catch (err) {
      console.error(err);
      toast.error("Error during detection!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-150 bg-gradient-to-br from-purple-950 via-purple-900 to-black flex items-center justify-center px-6 py-12 relative overflow-hidden rounded-2xl">
      {/* subtle animated background blobs */}
      <motion.div
        className="absolute top-8 left-8 w-[22rem] h-[22rem] bg-purple-700 rounded-full mix-blend-multiply filter blur-3xl opacity-25"
        animate={{ y: [0, 18, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-8 right-8 w-[24rem] h-[24rem] bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: 14, repeat: Infinity }}
      />

      {/* Main compact card */}
      <motion.div
        className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl bg-black/70 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-8 max-h-[80vh] overflow-y-auto"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* LEFT: text + upload + predictions */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">YOLOv8 Object Detection</h1>
            <p className="mt-2 text-gray-300 text-sm md:text-base">
              Demo of <span className="font-semibold text-purple-300">YOLOv8</span> — a
              convolutional neural network for object detection. Upload an image, it will detect
              objects and return bounding boxes + confidence scores.
            </p>
          </div>

          {/* File input */}
          <div className="mt-3">
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-200
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-gradient-to-r file:from-purple-600 file:to-pink-500
                         file:text-white cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow hover:scale-[1.02] transition"
            >
              {loading ? "Processing..." : "Upload & Detect"}
            </button>
            <div className="text-xs text-gray-400">Signature: <span className="text-pink-300 ml-1">{SIGNATURE_TEXT}</span></div>
          </div>

          {/* Predictions box */}
          <div className="mt-4 bg-white/5 rounded-lg p-3 border border-gray-700">
            <h4 className="text-sm font-medium text-pink-300 mb-2">Predictions</h4>
            {detections.length === 0 ? (
              <div className="text-xs text-gray-400">No detections yet.</div>
            ) : (
              <ul className="space-y-2">
                {detections.map((d, i) => (
                  <li key={i} className="flex justify-between text-sm text-gray-200 bg-white/2 px-3 py-2 rounded">
                    <span className="font-medium text-purple-200">{d.label}</span>
                    <span className="text-gray-300">{(d.confidence * 100).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* small footer signature outside image */}
          <div className="mt-auto text-xs text-gray-500 text-right pt-2">
            <span className="font-mono text-white">{SIGNATURE_TEXT}</span>
            <span className="mr-1 text-m"> © 2025</span>
          </div>
        </div>

        {/* RIGHT: image preview (watermarked) */}
        <div className="flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="watermarked result"
              className="w-full max-w-sm rounded-lg shadow-lg border border-gray-700"
            />
          ) : (
            <div className="w-full max-w-sm h-56 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-600 text-gray-500">
              Preview will appear here
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default UploadForm;
