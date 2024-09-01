import { Perf as R3FPerf } from 'r3f-perf';

const Perf = () => {
    return process.env.NODE_ENV === 'development' && <R3FPerf deepAnalyze matrixUpdate className="r3f-perf" />;
};

export default Perf;
