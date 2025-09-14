import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Terminal } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="text-center space-y-4">
        <div className="inline-block bg-primary text-primary-foreground p-3 rounded-full">
            <Terminal className="w-12 h-12" />
        </div>
        <h1 className="text-5xl font-bold font-code tracking-wider">SudoSolve CLI</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          The power of a command-line interface to solve your Sudoku puzzles instantly. Upload an image and let the magic happen.
        </p>
        <Link href="/solve">
          <Button size="lg" className="font-code text-lg">
            Let's Solve
          </Button>
        </Link>
      </div>
    </div>
  );
}
