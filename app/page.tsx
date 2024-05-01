import Analytics from "./analytics";
import Connections from "@/content/connections.mdx";
import Queries from "@/content/queries.mdx";
import ColdStarts from "@/content/cold-starts.mdx";
import Graphic from "@/components/graphic";
import Details from "@/content/details.mdx";

export default function Home() {
  return (
    <main className="flex max-w-screen-xl mx-auto min-h-screen flex-col items-center gap-16 py-16 px-8 lg:px-16">
      {/* Header */}
      <section className="flex flex-col lg:flex-row w-full items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl font-bold">Neon Latency Benchmarks</h1>
          <div className="mt-4 max-w-2xl text-base-content/70">
            An open-source project tracking real-world latency experiences on 
            {' '}<a className="link link-info" href="https://neon.tech">
              Neon Postgres
            </a>.

          </div>
        </div>
        <a
          href="https://github.com/joacoc/neon-latency-benchmarks"
          target="_blank"
          className="text-base-content hover:text-primary order-first lg:order-none transition-colors"
        >
          <svg
            width="50"
            height="49"
            viewBox="0 0 50 49"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="24.7551"
              cy="25.2449"
              r="23.7551"
              className="fill-base-100"
            />
            <g clipPath="url(#clip0_45_5588)">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M24.9255 0C11.1423 0 0 11.2292 0 25.1212C0 36.2258 7.13929 45.6256 17.0434 48.9525C18.2816 49.2026 18.7352 48.412 18.7352 47.7469C18.7352 47.1645 18.6944 45.1683 18.6944 43.0884C11.7607 44.5859 10.3168 40.0937 10.3168 40.0937C9.20255 37.1823 7.55153 36.4341 7.55153 36.4341C5.28214 34.8951 7.71684 34.8951 7.71684 34.8951C10.2342 35.0615 11.5551 37.4738 11.5551 37.4738C13.7832 41.2999 17.3735 40.2188 18.8179 39.5532C19.024 37.9311 19.6847 36.8082 20.3862 36.1845C14.8561 35.6021 9.03776 33.4394 9.03776 23.79C9.03776 21.045 10.0276 18.7992 11.5959 17.0525C11.3485 16.4288 10.4816 13.8496 11.8439 10.3977C11.8439 10.3977 13.9485 9.73211 18.6939 12.9763C20.7256 12.4264 22.8208 12.1467 24.9255 12.1443C27.0301 12.1443 29.1755 12.4358 31.1566 12.9763C35.9026 9.73211 38.0071 10.3977 38.0071 10.3977C39.3694 13.8496 38.502 16.4288 38.2546 17.0525C39.8643 18.7992 40.8133 21.045 40.8133 23.79C40.8133 33.4394 34.9949 35.5602 29.4235 36.1845C30.3316 36.9746 31.1153 38.4716 31.1153 40.8425C31.1153 44.2113 31.0745 46.9149 31.0745 47.7464C31.0745 48.412 31.5286 49.2026 32.7663 48.953C42.6704 45.6251 49.8097 36.2258 49.8097 25.1212C49.8505 11.2292 38.6674 0 24.9255 0Z"
                className="fill-current"
              />
            </g>
            <defs>
              <clipPath id="clip0_45_5588">
                <rect width="50" height="49" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </a>
        
      </section>

      {/* Analytics */}
      <Analytics />



    {/* Content */}
    <section className="w-full pt-40">
    <div className="sticky top-12 w-0 h-0 hidden xl:block">
      <div className="w-48">
        <div className="divider w-12"></div>
        <div className="flex flex-col gap-4 font-medium text-base-content/80">
        <a className="hover:text-base-content" href="#connections" >Connections</a>
          <a className="hover:text-base-content" href="#queries" >Queries</a>
          <a className="hover:text-base-content" href="#cold-starts">Cold Starts</a>
          <a className="hover:text-base-content" href="#benchmark-methodology" >Benchmark methodology</a>
          <a className="hover:text-base-content" href="#try-it-yourself" >Try It Yourself</a>
        </div>
      </div>
    </div>
    <div className="-mt-40 mx-auto prose dark:prose-invert">
      <div className="bg-primary/5 border-primary border-l-4 px-4 -mx-4 py-3 mb-12">
        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-primary shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className="font-semibold text-primary">What is Neon?</span>
        </div>
        <p className="m-0 mt-1">Neon is&nbsp;<a href="https://neon.tech/">serverless Postgres</a>: Standard PostgreSQL in a cloud platform that separates storage and compute, unlocking features like branching, autoscaling, and&nbsp;scale to zero.</p>
      </div>
      <Connections />
      <Queries  />
      <ColdStarts  />
      <Graphic version="IDE" />
      <Details />
    </div>
  </section>
    </main>
  );
}
