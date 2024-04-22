import { useState } from "react";

interface Props {
  title: string;
  stat?: string | number;
  help?: string;
  desc?: string;
  showTimer?: boolean;
}

export const formatFloatToStatString = (float?: number) => {
  return float ? `${Math.round(float)}` : "-";
};

const Stat = (props: Props) => {
  const { stat, title, help, desc, showTimer = false } = props;
  const [simulating, setSimulating] = useState(false);
  const runSimulation = (waitTime: number) => {
    if (!simulating) {
      setTimeout(() => {
        setSimulating(false);
      }, waitTime);
      setSimulating(true);
    }
  };

  return (
    <div className="stat">
      {simulating && (
        <div className="fixed inset-0 z-50 bg-base-100">
          <div className="flex flex-col items-center justify-center h-full gap-8">
            <span className="text-xl font-semibold">
              Simulating {stat}ms latency...
            </span>
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      )}
      {showTimer && (
        <div className="stat-figure">
          <svg
            className="inline-block w-8 h-8 text-base group hover:text-primary hover:cursor-pointer transition-all hover:rotate-6 hover:scale-105 transform"
            viewBox="0 0 21 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onClick={() => runSimulation(stat ? parseInt(stat.toString(), 10) : 0)}
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
              d="m11.3 3.4c1.8 0.2 3.5 0.7 4.9 1.7q0.1-0.1 0.1-0.2l1.7-1.6c0.4-0.4 1-0.4 1.4 0 0.4 0.4 0.4 1 0 1.4l-1.6 1.6c2 1.9 3.2 4.5 3.2 7.4 0 5.7-4.7 10.3-10.5 10.3-5.8 0-10.5-4.6-10.5-10.3 0-5.4 4.3-9.9 9.7-10.3m0.8 19c4.9 0 8.9-3.9 8.9-8.7 0-4.8-4-8.7-8.9-8.7-4.9 0-8.9 3.9-8.9 8.7 0 4.8 4 8.7 8.9 8.7zm5.1-3.7c-1.3 1.3-3.1 2.1-5.1 2.1-4 0-7.2-3.2-7.2-7.1 0-3.9 3.2-7.1 7.2-7.1v7.1z"
            />
            <path
              className="group-hover:animate-clickyclicky"
              fill="currentColor"
              d="m9.7 3.4v-1.8h-1.7c-0.4 0-0.8-0.3-0.8-0.8 0-0.4 0.4-0.8 0.8-0.8h2.5 2.5c0.4 0 0.8 0.4 0.8 0.8 0 0.5-0.4 0.8-0.8 0.8h-1.7v1.8"
            />
          </svg>
        </div>
      )}
      <h3 className="stat-title">
        {title}
        {help && (
          <span className="tooltip translate-x-1 translate-y-1" data-tip={help}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </span>
        )}
      </h3>
      <p className="stat-value">{stat}</p>
      <div className="stat-desc">{desc}</div>
    </div>
  );
};

export default Stat;
