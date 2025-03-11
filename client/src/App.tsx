import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

import Home from "@/pages/Home";
import ClassicGame from "@/pages/ClassicGame";
import SpeedGame from "@/pages/SpeedGame";
import TimeGame from "@/pages/TimeGame";
import LiveGame from "@/pages/LiveGame";
import TestGame from "@/pages/TestGame";
import NotFound from "@/pages/not-found";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game/classic" component={ClassicGame} />
      <Route path="/game/speed" component={SpeedGame} />
      <Route path="/game/time" component={TimeGame} />
      <Route path="/game/live" component={LiveGame} />
      <Route path="/game/test" component={TestGame} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-black text-white dark:bg-black dark:text-white">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-6">
          <Router />
        </main>
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
