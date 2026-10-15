import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Kiosk from "@/app/kiosk/page";
import Manager from "@/app/manager/page";
import { DemoProvider } from "@/components/demo-provider";
import { Performance } from "@/components/performance";
import { initialRecords } from "@/lib/data";
function mount() {
  render(
    <DemoProvider>
      <Kiosk />
    </DemoProvider>,
  );
}
function login() {
  fireEvent.click(screen.getByText("Fill demo credentials"));
  fireEvent.click(screen.getByRole("button", { name: "View my performance" }));
}
afterEach(() => vi.useRealTimers());
describe("kiosk session", () => {
  it("signs in with demo credentials and exposes only the signed-in associate", () => {
    mount();
    login();
    expect(screen.getByText("You’re meeting the standard.")).toBeTruthy();
    expect(screen.queryByText("EMP001")).toBeNull();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByText("Manager demonstration")).toBeNull();
    expect(
      screen.getByRole("button", { name: /Finish & Sign Out/ }),
    ).toBeTruthy();
  });
  it("rejects incorrect credentials and clears the PIN", () => {
    mount();
    fireEvent.change(screen.getByLabelText("Employee ID"), {
      target: { value: "002" },
    });
    fireEvent.change(screen.getByLabelText("Private PIN"), {
      target: { value: "9999" },
    });
    fireEvent.click(screen.getByText("View my performance"));
    expect(screen.getByRole("alert").textContent).toContain("doesn’t match");
    expect(
      (screen.getByLabelText("Private PIN") as HTMLInputElement).value,
    ).toBe("");
  });
  it("enters EMP002 and PIN using numeric keypad, including clear/backspace", () => {
    mount();
    for (const key of ["0", "0", "3"])
      fireEvent.click(screen.getByRole("button", { name: key }));
    fireEvent.click(screen.getByLabelText("Backspace"));
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(
      (screen.getByLabelText("Employee ID") as HTMLInputElement).value,
    ).toBe("002");
    fireEvent.focus(screen.getByLabelText("Private PIN"));
    fireEvent.click(screen.getByRole("button", { name: "9" }));
    fireEvent.click(screen.getByLabelText("Clear"));
    for (const key of ["1", "2", "3", "4"])
      fireEvent.click(screen.getByRole("button", { name: key }));
    fireEvent.click(screen.getByText("View my performance"));
    expect(screen.getByText("You’re meeting the standard.")).toBeTruthy();
  });
  it("logs out after 60 seconds and resets all private screen state", () => {
    vi.useFakeTimers();
    mount();
    login();
    fireEvent.click(screen.getByText("Explore your 4-week history"));
    act(() => vi.advanceTimersByTime(59000));
    expect(screen.getByRole("timer").textContent).toContain("1s");
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText(/Your session ended for privacy/)).toBeTruthy();
    expect(
      (screen.getByLabelText("Employee ID") as HTMLInputElement).value,
    ).toBe("");
    expect(screen.queryByText("Four weeks. One clear view.")).toBeNull();
  });
  it("resets timeout on real input interaction without resetting on timer rerenders", () => {
    vi.useFakeTimers();
    mount();
    login();
    act(() => vi.advanceTimersByTime(45000));
    fireEvent.pointerDown(window);
    act(() => vi.advanceTimersByTime(45000));
    expect(screen.getByText("You’re meeting the standard.")).toBeTruthy();
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByText("Check your progress")).toBeTruthy();
  });
  it("checks wall-clock deadline when the tab becomes visible again", () => {
    vi.useFakeTimers();
    mount();
    login();
    vi.setSystemTime(Date.now() + 61000);
    fireEvent(document, new Event("visibilitychange"));
    expect(screen.getByText(/Your session ended for privacy/)).toBeTruthy();
  });
  it("supports manual sign-out and Spanish screens", () => {
    mount();
    fireEvent.click(screen.getByLabelText("Switch to Spanish"));
    expect(document.documentElement.lang).toBe("es");
    fireEvent.click(screen.getByText("Completar credenciales de prueba"));
    fireEvent.click(screen.getByText("Ver mi rendimiento"));
    expect(screen.getByText("Estás cumpliendo el estándar.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Terminar y salir/ }));
    expect(screen.getByText("Check your progress")).toBeTruthy();
    expect(document.documentElement.lang).toBe("en");
  });
  it("navigates through weeks and daily details with official hours", () => {
    mount();
    login();
    fireEvent.click(screen.getByText("Explore your 4-week history"));
    const days = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.includes("Friday"));
    expect(days).toHaveLength(1);
    fireEvent.click(days[0]);
    expect(screen.getByText("Earned standard hours")).toBeTruthy();
    expect(screen.getByText("Actual productive hours")).toBeTruthy();
    expect(screen.getByText("Official performance")).toBeTruthy();
  });
  it("never invents percentages for missing daily data", () => {
    render(<Performance records={initialRecords} id="EMP007" />);
    fireEvent.click(screen.getByText("Explore your 4-week history"));
    const missing = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.includes("Wednesday"))!;
    expect(missing.textContent).toContain("Unavailable");
    fireEvent.click(missing);
    expect(
      screen.getByText(/No finalized record is available for this day/),
    ).toBeTruthy();
  });
  it("requires separate explicit manager demo access", () => {
    render(
      <DemoProvider>
        <Manager />
      </DemoProvider>,
    );
    expect(screen.queryByText("Associate performance")).toBeNull();
    fireEvent.click(screen.getByText(/Enter manager demonstration/));
    expect(screen.getByText("Associate performance")).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "EMP002" },
    });
    expect(screen.getByText("1 / 30")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("View EMP002"));
    expect(screen.getByText("You’re meeting the standard.")).toBeTruthy();
  });
  it("does not persist credentials or personal records in browser storage", () => {
    const local = vi.spyOn(Storage.prototype, "setItem");
    mount();
    login();
    fireEvent.click(screen.getByRole("button", { name: /Finish & Sign Out/ }));
    expect(local).not.toHaveBeenCalled();
    local.mockRestore();
  });
});
