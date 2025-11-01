import { AppProvider, useApp } from "./state/store";
import FileUpload from "./components/FileUpload";
import ControlBar from "./components/ControlBar";
import FeatureList from "./components/FeatureList";
import GraphView from "./components/GraphView"; // Suhas
import "./index.css";
import "./styles/globals.css";

function Main() {
  const { model, graph, searchHits } = useApp();
  return (
    <div className="p-4 flex flex-col justify-center items-center gap-4 w-full h-full min-h-screen">
      <h1>Mini Variability Visualizer</h1>
      <FileUpload />
      <ControlBar />
      {!model && <p>Upload a JSON feature model to begin.</p>}
      {model && (
        <>
          {/* can delete before submit */}
          <FeatureList />

          {/* pass graph and searchHits to Suhas's GraphView */}
          <GraphView graph={graph} highlights={searchHits} model={model} />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
}
