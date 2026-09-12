import { Metadata } from "next";
import HelpCentreClient from "./HelpCentreClient";

export const metadata: Metadata = {
  title: "Tourvaa Customer Support Help Centre",
  description:
    "Welcome to the Tourvaa Help Centre - everything you need to plan, book, and enjoy your adventure.",
};

export default function HelpCentrePage() {
  return <HelpCentreClient />;
}
