import { Route, Routes } from "react-router-dom"
import "./App.css"
import Navbar from "./components/Navbar/navbar.component"
import Home from "./routes/Home/home.page"

export const App = () => (
  <div className="App">
    <Routes>
      <Route path="/" element={<Navbar />}>
        <Route index element={<Home />} />
      </Route>
    </Routes>
  </div>
)
