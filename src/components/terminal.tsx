"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { solveSudoku } from "@/app/actions";
import Image from "next/image";
import { Terminal as TerminalIcon, Loader2 } from "lucide-react";

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
    } else if (command === 'solve') {
        newOutput.push({ type: "error", content: "The 'solve' command is no longer needed. The puzzle is solved automatically after uploading." });
    } else {
      newOutput.push({ type: "error", content: `Command not found: ${command}. Available commands: start, upload, download, clear` });
    }

    setOutput(newOutput);
    setInput("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setOutput((prev) => [
        ...prev,
        { type: "response", content: `File selected: ${file.name}. Solving puzzle, please wait...` },
      ]);
      const formData = new FormData();
      formData.append("image", file);
      formAction(formData);
    }
  };

  return (
    <div className="w-full h-screen bg-background flex flex-col font-code">
      <div className="flex-shrink-0 bg-gray-800/50 p-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">SudoSolve CLI</span>
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
                <span className="text-primary mr-2">$</span>
                <span className="text-foreground">{line.content}</span>
              </div>
            )}
            {line.type === "response" && <p className="text-foreground">{line.content}</p>}
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
                <Loader2 className="w-4 h-4 text-primary animate-spin mr-2" />
                <span className="text-foreground">Processing...</span>
            </div>
        )}

        <div ref={endOfOutputRef} />
      </div>
      <div className="flex-shrink-0 p-2 border-t border-gray-700">
        <form onSubmit={handleCommand} className="flex items-center">
          <span className="text-primary mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent text-foreground focus:outline-none"
            autoComplete="off"
            disabled={isPending}
          />
        </form>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      </div>
    </div>
  );
}
