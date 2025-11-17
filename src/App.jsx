import { AppProvider, useApp } from "./state/store";
import FileUpload from "./components/FileUpload";
import SearchBar from "./components/SearchBar";
import FeatureList from "./components/FeatureList";
import Visualizer from "./components/Visualizer";
import "./index.css";
import "./styles/globals.css";
import JsonUploadInstructions from "./components/JsonUploadInstructions";
import ExampleDownloads from "./components/ExampleDownloads";

function Main() {
  const { model, graph, searchHits } = useApp();

  return (
    <div className="p-4 flex flex-col justify-center items-center gap-4 w-full h-full min-h-screen">
      <h1 className="mx-auto text-center text-xl md:text-5xl mt-2 font-semibold tracking-tight text-transparent bg-clip-text  from-blue-400 to-indigo-300">
        Mini Feature Variability Visualizer
      </h1>

      {model && (
        <>
          <SearchBar />
          <FeatureList />

          <Visualizer graph={graph} highlights={searchHits} model={model} />
        </>
      )}
      <FileUpload />
      <ExampleDownloads />
      <JsonUploadInstructions />
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
