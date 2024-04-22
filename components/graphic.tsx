"use client";
import { useEffect, useState } from "react";
import { useInterval } from "usehooks-ts";

interface Props {
  version: "IDE" | "COST";
}

const Graphic = (props: Props) => {
  const { version } = props;
  const [step, setStep] = useState(0);
  const [idleCounter, setIdleCounter] = useState<number>(0);
  const [funCounter, setFunCounter] = useState<number>(0);
  const [slowed, setSlowed] = useState<boolean>(true);

  const runSimulation = () => {
    if (step == 0) {
      setStep(1);
    }
    setFunCounter(funCounter + 1);
  };

  const checkHandler = () => {
    setSlowed(!slowed);
  };

  useInterval(() => {
    if (idleCounter > 0) setIdleCounter(idleCounter - 1);
    if (funCounter > 0) setFunCounter(funCounter - 1);
  }, 300);

  useEffect(() => {
    if (step > 0) {
      switch (step) {
        case 1:
          setTimeout(() => {
            setStep(step + 1);
          }, 5);
          break;
        case 2:
          setTimeout(() => {
            setStep(step + 1);
          }, 5);
          break;
        case 3:
          setTimeout(
            () => {
              setStep(step + 1);
            },
            idleCounter > 0 ? 10 : slowed ? 800 : 350
          );
          break;
        case 4:
          setTimeout(
            () => {
              setStep(step + 1);
            },
            idleCounter > 0 ? 10 : slowed ? 800 : 33
          );
          break;
        case 5:
          setIdleCounter(46);
          setTimeout(
            () => {
              setStep(0);
            },
            idleCounter > 0 ? 10 : 3
          );
          break;
      }
    }
  }, [step]); // <-- dependency array

  return (
    <>
    <div className="mt-8 mb-2 label gap-2">
    <button className="btn btn-primary" onClick={runSimulation}>Run a Query</button>
    <strong className="flex-1 text-right">Cold start timing:</strong>
      <div className="label-text">Slowed Down</div>
      <input type="checkbox" className="toggle" onChange={checkHandler}/>
      <span className="label-text">Realistic</span> 
    </div>
    <svg
      viewBox="0 0 655 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none  w-full"
      id="cold-starts"
    >
      <g data-id="ide">
        <rect
          x="0"
          width="236"
          y="20"
          height="140"
          rx="2"
          className="fill-neutral"
        />
        <rect
          x="3"
          width="230"
          y="40"
          height="117"
          rx="1"
          className="fill-neutral-content/30"
        />
        <circle cx="10" cy="30" r="4" className="fill-neutral-content/50" />
        <circle cx="24" cy="30" r="4" className="fill-neutral-content/50" />
        <circle cx="38" cy="30" r="4" className="fill-neutral-content/50" />
        <g
          className="fill-neutral-content font-mono text-xs"
          transform="translate(10,34)"
        >
          {step === 1 ? (
            <rect
              x="-6"
              y="15"
              width="230"
              height="20"
              className="fill-primary/50"
            />
          ) : (
            ""
          )}
          <text y="30">
            <tspan className="fill-info">import &#123;</tspan>{" "}
            <tspan className="fill-[#bf8fff]">Client</tspan>{" "}
            <tspan className="fill-info">&#125; from </tspan>&apos;
            <tspan className="fill-primary">pg</tspan>&apos;
          </text>
          {step === 2 ? (
            <rect
              x="-6"
              y="35"
              width="230"
              height="20"
              className="fill-primary/50"
            />
          ) : (
            ""
          )}
          <text y="50">
            <tspan className="fill-[#bf8fff]">const c</tspan> = new{" "}
            <tspan className="fill-[#bf8fff]">Client</tspan>
            <tspan className="fill-info">()</tspan>
          </text>
          {step === 3 ? (
            <rect
              x="-6"
              y="55"
              width="230"
              height="20"
              className="fill-primary/50"
            />
          ) : (
            ""
          )}
          <text y="70">
            <tspan className="fill-info">await</tspan>{" "}
            <tspan className="fill-[#bf8fff]">c</tspan>.
            <tspan className="fill-warning">connect</tspan>
            <tspan className="fill-info">()</tspan>
          </text>
          {step === 4 ? (
            <rect
              x="-6"
              y="75"
              width="230"
              height="20"
              className="fill-primary/50"
            />
          ) : (
            ""
          )}
          <text y="90">
            <tspan className="fill-[#bf8fff]">const r</tspan> ={" "}
            <tspan className="fill-info">await</tspan>{" "}
            <tspan className="fill-[#bf8fff]">c</tspan>.
            <tspan className="fill-warning">query</tspan>
            <tspan className="fill-info">(</tspan>&apos;...&apos;
            <tspan className="fill-info">)</tspan>
          </text>
          {step === 5 ? (
            <rect
              x="-6"
              y="95"
              width="230"
              height="20"
              className="fill-primary/50"
            />
          ) : (
            ""
          )}
          <text y="110">
            <tspan className="fill-[#bf8fff]">console</tspan>.
            <tspan className="fill-warning">log</tspan>
            <tspan className="fill-info">(</tspan>
            <tspan className="fill-[#bf8fff]">r.rows</tspan>
            <tspan className="fill-info">)</tspan>
          </text>
        </g>
      </g>
      <rect x="273" width="380" height="180" rx="6" className="fill-neutral" />
      <text
        className="fill-stone-50 text-xl font-semibold"
        x="463"
        y="26"
        dominantBaseline="middle"
        textAnchor="middle"
      >
        Neon
      </text>
      <g data-id="controlplane">
        <rect
          x="299"
          y="56"
          width="40"
          height="100"
          rx="1"
          className="fill-secondary"
        />
        <rect
          x="305"
          y="50"
          width="40"
          height="100"
          rx="1"
          className="fill-stone-50 stroke-2 stroke-stone-900"
        />
        <text
          className="fill-stone-900"
          transform="translate(325, 100) rotate(-90)"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          Control
        </text>
      </g>

      <g data-id="compute">
        <rect
          x="369"
          y="56"
          width="140"
          height="100"
          rx="1"
          className="fill-primary"
        />
        <rect
          x="375"
          y="50"
          width="140"
          height="100"
          rx="1"
          className="fill-stone-50 stroke-2 stroke-stone-900"
        />
        <rect
          x="420"
          y="85"
          width="50"
          height="50"
          className={
            step === 3 && idleCounter === 0
              ? "fill-primary/30"
              : step === 4 && idleCounter === 0
              ? "fill-primary/60"
              : idleCounter === 0
              ? "fill-neutral/10"
              : "fill-primary"
          }
        />
        {idleCounter > 0 && (
          <path
            d="M468,131h-46"
            className="stroke-neutral"
            strokeWidth="5"
            strokeDasharray="46,46"
            strokeDashoffset={idleCounter+46}
          />
        )}
        <text
          className={`text-4xl ${
            step === 0 && idleCounter === 0 ? "fill-neutral/10" : "fill-neutral"
          }`}
          x="445"
          y="112"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {step === 3
            ? "😑"
            : step === 4
            ? "🤔"
            : funCounter > 6
            ? "🥳"
            : funCounter > 4
            ? "😲"
            : idleCounter === 0
            ? "😴"
            : "😀"}
        </text>
        <text
          className="fill-stone-900"
          x="445"
          y="70"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          Compute
        </text>
      </g>
      <g data-id="storage">
        <rect
          x="539"
          y="56"
          width="80"
          height="100"
          rx="1"
          className="fill-accent"
        />
        <rect
          x="545"
          y="50"
          width="80"
          height="100"
          rx="1"
          className="fill-stone-50 stroke-2 stroke-stone-900"
        />

        <text
          className="fill-stone-900"
          x="585"
          y="70"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          Storage
        </text>
        <text
          className="fill-stone-900 text-4xl"
          x="585"
          y="115"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          🗄️
        </text>
      </g>

      <g data-id="arrows">
        <path
          data-id="connect"
          d="M236 100 h 64"
          className="stroke-neutral-content stroke-[3px]"
        />
        <path
          data-id="control_compute"
          d="M346 80 h 28l -5 -5 m5 5l-5 5"
          className="stroke-stone-50 stroke-[3px]"
        />
        <path
          data-id="compute_control"
          d="M374 120 h -28l 5 -5 m-5 5l5 5"
          className="stroke-stone-50 stroke-[3px]"
        />
        <path
          data-id="compute_storage"
          d="M516 80 h 28l -5 -5 m5 5l-5 5"
          className="stroke-stone-50 stroke-[3px]"
        />
        <path
          data-id="storage_compute"
          d="M544 120 h -28l 5 -5 m-5 5l5 5"
          className="stroke-stone-50 stroke-[3px]"
        />
      </g>
      
    </svg>
      
    
    </>
  );
};

export default Graphic;
