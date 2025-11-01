import { AppProvider, useApp } from "./state/store";
import FileUpload from "./components/FileUpload";
import SearchBar from "./components/SearchBar";
import FeatureList from "./components/FeatureList";
import Visualizer from "./components/Visualizer"; // Suhas
import "./index.css";
import "./styles/globals.css";

function Main() {
  const { model, graph, searchHits } = useApp();
  return (
    <div className="p-4 flex flex-col justify-center items-center gap-4 w-full h-full min-h-screen">
      <h1>Mini Variability Visualizer</h1>
      <SearchBar />
      {model && (
        <>
          {/* can delete before submit */}
          <FeatureList />

          {/* pass graph and searchHits to Suhas's Visualizer */}
          <Visualizer graph={graph} highlights={searchHits} model={model} />
        </>
      )}
      <FileUpload />
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
