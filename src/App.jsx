import React from "react";
import { ThemeProvider } from "@/contexts/theme-context";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "@/pages/Layout";
import Dashboard from "@/pages/Dashboard";

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
                    path: "reports",
                    element: <h1 className="title">reports</h1>,
                },
                {
                    path: "customers",
                    element: <h1 className="title">Customers</h1>,
                },
                {
                    path: "analytics",
                    element: <h1 className="title">Analytics</h1>,
                },
                {
                    path: "analytics",
                    element: <h1 className="title">Analytics</h1>,
                },
                {
                    path: "analytics",
                    element: <h1 className="title">Analytics</h1>,
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
