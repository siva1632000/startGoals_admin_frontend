import React from "react";
import { ThemeProvider } from "@/contexts/theme-context";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "@/pages/Layout";
import Dashboard from "@/pages/Dashboard";
import Classroom from "./live-stream/Classroom";

const App = () => {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Layout />,
            children: [
                {
                    index: true,
                    element: <Dashboard />,
                },
                {
                    path: "analytics",
                    element: <h1 className="title">Analytics</h1>,
                },
                {
                    path: "join-stream",
                    element: <Classroom />,
                },
                {
                    path: "live-stream",
                    element: <Classroom />,
                },
            ],
        },
    ]);

    return (
        <ThemeProvider storageKey="theme">
            <RouterProvider router={router} />
        </ThemeProvider>
    );
};

export default App;
