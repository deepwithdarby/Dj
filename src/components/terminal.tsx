"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { solveSudoku } from "@/app/actions";
import Image from "next/image";
import { Terminal as TerminalIcon, Upload, Download, Loader2 } from "lucide-react";

type OutputLine = {
  type: "command" | "response" | "error" | "image" | "component";
  content: string | React.ReactNode;
};

const initialState: { solvedImageUrl: string | null; error: string | null } = {
  solvedImageUrl: null,
  error: null,
};

export function Terminal() {
  const [state, formAction, isPending] = useActionState(solveSudoku, initialState);

  const [input, setInput] = useState("");
  const [output, setOutput] = useState<OutputLine[]>([
    { type: "response", content: "Welcome to SudoSolve CLI. Type 'start' to begin." },
  ]);
  const [isStarted, setIsStarted] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endOfOutputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    endOfOutputRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output, isPending]);

  useEffect(() => {
    if (state.error) {
      setOutput((prev) => [...prev, { type: "error", content: state.error }]);
    }
    if (state.solvedImageUrl) {
        setOutput((prev) => [
            ...prev,
            { type: "response", content: "Puzzle solved successfully! Type 'download' to save the image." },
            { type: "image", content: state.solvedImageUrl },
        ]);
        setImagePreview(null);
        setImageFile(null);
    }
  }, [state]);

  const handleCommand = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const command = input.trim().toLowerCase();
    const newOutput: OutputLine[] = [...output, { type: "command", content: input }];

    if (command === "start") {
      setIsStarted(true);
      newOutput.push({ type: "response", content: "SudoSolve is ready. Type 'upload' to select a Sudoku image." });
    } else if (!isStarted && command !== "start") {
        newOutput.push({ type: "error", content: "Please type 'start' first to initialize." });
    } else if (command === "upload") {
      fileInputRef.current?.click();
    } else if (command === "solve") {
      if (!imageFile) {
        newOutput.push({ type: "error", content: "No image uploaded. Please use the 'upload' command first." });
      } else {
        const formData = new FormData();
        formData.append("image", imageFile);
        formAction(formData);
        newOutput.push({ type: "response", content: "Solving puzzle..." });
      }
    } else if (command === "download") {
        if(state.solvedImageUrl) {
            const link = document.createElement('a');
            link.href = state.solvedImageUrl;
            link.download = 'solved-sudoku.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            newOutput.push({ type: "response", content: "Solved image downloaded." });
        } else {
            newOutput.push({ type: "error", content: "No solved image to download. Please 'solve' a puzzle first." });
        }
    } else if (command === 'clear') {
        setOutput([]);
        setInput("");
        return; // prevent adding to history
    } else {
      newOutput.push({ type: "error", content: `Command not found: ${command}. Available commands: start, upload, solve, download, clear` });
    }

    setOutput(newOutput);
    setInput("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      setOutput((prev) => [
        ...prev,
        { type: "response", content: `File selected: ${file.name}. Type 'solve' to proceed.` },
        { type: "image", content: preview },
      ]);
    }
  };

  return (
    <div className="w-full max-w-4xl h-[80vh] bg-[#0d1117] rounded-lg border border-gray-700 shadow-2xl flex flex-col font-code">
      <div className="flex-shrink-0 bg-gray-800/50 p-3 flex items-center justify-between border-b border-gray-700 rounded-t-lg">
        <div className="flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-green-400" />
            <span className="text-sm font-semibold">SudoSolve CLI</span>
        </div>
        <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
      </div>
      <div className="flex-grow p-4 overflow-y-auto" onClick={() => inputRef.current?.focus()}>
        {output.map((line, index) => (
          <div key={index} className="mb-2">
            {line.type === "command" && (
              <div className="flex items-center">
                <span className="text-green-400 mr-2">$</span>
                <span>{line.content}</span>
              </div>
            )}
            {line.type === "response" && <p className="text-gray-300">{line.content}</p>}
            {line.type === "error" && <p className="text-red-400">Error: {line.content}</p>}
            {line.type === "image" && typeof line.content === 'string' && (
              <div className="mt-2 w-48">
                <Image src={line.content} alt="Sudoku" width={200} height={200} className="rounded-md border border-gray-600"/>
              </div>
            )}
            {line.type === "component" && line.content}
          </div>
        ))}

        {isPending && (
            <div className="flex items-center">
                <Loader2 className="w-4 h-4 text-green-400 animate-spin mr-2" />
                <span className="text-gray-300">Processing...</span>
            </div>
        )}

        <div ref={endOfOutputRef} />
      </div>
      <div className="flex-shrink-0 p-2 border-t border-gray-700">
        <form onSubmit={handleCommand} className="flex items-center">
          <span className="text-green-400 mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent focus:outline-none"
            autoComplete="off"
            disabled={isPending}
          />
        </form>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      </div>
    </div>
  );
}
