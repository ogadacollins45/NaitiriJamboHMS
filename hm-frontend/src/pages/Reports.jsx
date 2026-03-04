import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { BarChart2 } from "lucide-react";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Reports() {
  const data = {
    labels: ["OPD", "IPD", "Emergency"],
    datasets: [
      {
        label: "Patient Category",
        data: [120, 80, 45],
        backgroundColor: ["#2563eb", "#16a34a", "#dc2626"],
      },
    ],
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <BarChart2 className="text-primary" /> Reports
      </h1>
      <div className="bg-white shadow rounded-xl p-6">
        <Bar data={data} />
      </div>
    </div>
  );
}
