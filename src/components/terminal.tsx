"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { solveSudoku } from "@/app/actions";
import Image from "next/image";
import { Terminal as TerminalIcon, Facebook, Instagram, Twitter } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type OutputLine = {
  type: "command" | "response" | "error" | "image" | "component";
  content: string | React.ReactNode;
};

const initialState: { solvedImageUrl: string | null; error: string | null } = {
  solvedImageUrl: null,
  error: null,
};

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);


export function Terminal() {
  const [state, formAction, isPending] = useActionState(solveSudoku, initialState);

  const [input, setInput] = useState("");
  const [output, setOutput] = useState<OutputLine[]>([
    { type: "response", content: "Welcome to SudoSolve CLI. Type 'start' to begin." },
  ]);
  const [isStarted, setIsStarted] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  
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
    if (isPending) {
      setProgress(0);
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(timer);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      return () => clearInterval(timer);
    } else {
        setProgress(100);
        setTimeout(() => setProgress(0), 1000); 
    }
  }, [isPending]);

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

    if (command === 'clear') {
        setOutput([{ type: "response", content: "Welcome to SudoSolve CLI. Type 'start' to begin." }]);
        setInput("");
        setIsStarted(false);
        setImageFile(null);
        return; 
    }

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
    } else if (command === 'solve') {
        if (imageFile) {
            newOutput.push({ type: "response", content: "Solving puzzle, please wait..." });
            const formData = new FormData();
            formData.append("image", imageFile);
            formAction(formData);
        } else {
            newOutput.push({ type: "error", content: "No image uploaded. Please use the 'upload' command first." });
        }
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
      setOutput((prev) => [
        ...prev,
        { type: "response", content: `File selected: ${file.name}. Type 'solve' to process the image.` },
      ]);
    }
    // Reset file input to allow uploading the same file again
    if(e.target) {
        e.target.value = "";
    }
  };

  const handleShare = (platform: 'facebook' | 'instagram' | 'x' | 'whatsapp') => {
    const url = 'https://sudosolvecli.vercel.app';
    const text = 'Check out this cool Sudoku solver!';
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'instagram':
        // Instagram does not support direct sharing via web links.
        // We can inform the user about this.
        setOutput((prev) => [...prev, { type: "response", content: "Sharing on Instagram is not supported via web. You can copy the link and share it manually: https://sudosolvecli.vercel.app" }]);
        return;
    }
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full h-screen bg-background flex flex-col font-code">
      <div className="flex-shrink-0 bg-gray-800/50 p-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">SudoSolve CLI</span>
        </div>
        <div className="flex items-center gap-4 text-foreground">
          <Facebook className="w-5 h-5 cursor-pointer hover:text-primary" onClick={() => handleShare('facebook')} />
          <Instagram className="w-5 h-5 cursor-pointer hover:text-primary" onClick={() => handleShare('instagram')} />
          <Twitter className="w-5 h-5 cursor-pointer hover:text-primary" onClick={() => handleShare('x')} />
          <WhatsAppIcon className="w-5 h-5 cursor-pointer hover:text-primary" onClick={() => handleShare('whatsapp')} />
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
            <div className="w-full max-w-xs my-2">
                <Progress value={progress} className="h-2 bg-gray-700"/>
                <span className="text-foreground text-xs mt-1">Processing...</span>
            </div>
        )}
        
        {!isPending && (
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
        )}

        <div ref={endOfOutputRef} />
      </div>
       <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </div>
  );
}
