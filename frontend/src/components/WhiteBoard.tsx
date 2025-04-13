import React, { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const Whiteboard: React.FC<{roomId: string}> = ({roomId}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [color, setColor] = useState<string>("black");
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [isErasing, setIsErasing] = useState<boolean>(false);
  const lastPoint = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 800;
    const height = 600;
    
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.border = "2px solid black";

    const context = canvas.getContext("2d");
    if (!context) return;

    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = lineWidth;
    context.strokeStyle = color;
    contextRef.current = context;

    socket.emit("joinRoom", roomId);

    socket.on("loadCanvas", (data) => {
      if (canvas && context && data) {
        const img = new Image();
        img.src = data;
        img.onload = () => {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0);
        };
      }
    });

    socket.on("receiveDraw", (data) => {
      const { startX, startY, endX, endY, color: remoteColor, width: remoteWidth, erase } = data;
      
      if (context) {
        context.save();
        
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        context.strokeStyle = erase ? "white" : remoteColor;
        context.lineWidth = remoteWidth;
        context.stroke();
        context.closePath();
        
        context.restore();
      }
    });

    socket.on("clearCanvas", () => {
      if (canvas && context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    return () => {
      socket.off("receiveDraw");
      socket.off("loadCanvas");
      socket.off("clearCanvas");
    };
  }, [roomId]);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.lineWidth = lineWidth;
      contextRef.current.strokeStyle = isErasing ? "white" : color;
    }
  }, [color, lineWidth, isErasing]);

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = event.nativeEvent;
    if (!contextRef.current) return;

    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    lastPoint.current = { x: offsetX, y: offsetY };
    setIsDrawing(true);
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !lastPoint.current) return;
    
    const { offsetX, offsetY } = event.nativeEvent;
    const ctx = contextRef.current;
    
    ctx.strokeStyle = isErasing ? "white" : color;
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    
    socket.emit("drawing", {
      roomId,
      startX: lastPoint.current.x,
      startY: lastPoint.current.y,
      endX: offsetX,
      endY: offsetY,
      color,
      width: lineWidth,
      erase: isErasing
    });
    
    lastPoint.current = { x: offsetX, y: offsetY };
  };

  const stopDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
          if (canvasRef.current) {
        const imageData = canvasRef.current.toDataURL();
        socket.emit("finalizeDrawing", { roomId, data: imageData });
      }
    }
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const clearCanvas = () => {
    if (contextRef.current && canvasRef.current) {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      socket.emit("clearCanvas", { roomId });
    }
  };
  
  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 space-x-2">
        <button onClick={clearCanvas} className="px-4 py-2 bg-red-500 text-white rounded">Clear</button>
        <button 
          onClick={() => setIsErasing(!isErasing)} 
          className={`px-4 py-2 ${isErasing ? 'bg-blue-500' : 'bg-gray-500'} text-white rounded`}
        >
          {isErasing ? "Drawing Mode" : "Eraser Mode"}
        </button>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="px-2 py-1 border rounded cursor-pointer"
        />
        <span className="text-sm text-gray-600">Line Width: {lineWidth}</span>
        <input
          type="range"
          min="1"
          max="20"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="px-2 py-1 border rounded"
        />
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="bg-white shadow-lg rounded"
      />
    </div>
  );
};

export default Whiteboard;
