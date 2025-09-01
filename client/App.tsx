import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import MySQLVehiclesOriginalStyle from "./pages/MySQLVehiclesOriginalStyle";
import { IconDemo } from "./pages/IconDemo";
import { PaymentCalculatorDemo } from "./pages/PaymentCalculatorDemo";
import { WooCommerceVehicles } from "./pages/WooCommerceVehicles";
import WordPressApiTest from "./pages/WordPressApiTest";
import WordPressVehicles from "./pages/WordPressVehicles";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/cars-for-sale/*"
            element={<MySQLVehiclesOriginalStyle />}
          />
          <Route
            path="/mysql-vehicles"
            element={<MySQLVehiclesOriginalStyle />}
          />
          <Route path="/icon-demo" element={<IconDemo />} />
          <Route path="/payment-demo" element={<PaymentCalculatorDemo />} />
          <Route
            path="/woocommerce-vehicles"
            element={<WooCommerceVehicles />}
          />
          <Route
            path="/wordpress-api-test"
            element={<WordPressApiTest />}
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
