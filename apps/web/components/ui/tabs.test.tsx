// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

describe("controlled tabs", () => {
  afterEach(cleanup);

  it("renders immediately and changes view without reading navigation state", () => {
    const onValueChange = vi.fn();

    render(
      <Tabs defaultValue="brief" onValueChange={onValueChange} value="brief">
        <TabsList>
          <TabsTrigger value="brief">Brief</TabsTrigger>
          <TabsTrigger value="ask">Ask Mue</TabsTrigger>
        </TabsList>
        <TabsContent value="brief">Contenu du brief</TabsContent>
        <TabsContent value="ask">Conversation</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText("Contenu du brief")).not.toBeNull();
    expect(screen.queryByText("Conversation")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Ask Mue" }));
    expect(onValueChange).toHaveBeenCalledWith("ask");
  });
});
