import { render, screen } from "@testing-library/react";
import MapLoading from "./map-loading.component";

describe("MapLoading", () => {
  it("covers the map with a labelled spinner", () => {
    render(<MapLoading />);

    expect(screen.getByLabelText("Loading map")).toBeInTheDocument();
  });
});
