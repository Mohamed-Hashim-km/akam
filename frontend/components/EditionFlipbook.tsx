"use client";

import React from "react";
import Pdf3DFlipbook from "./Pdf3DFlipbook";
import { formatAssetUrl } from "@/lib/config";

interface EditionFlipbookProps {
  pdfUrl: string;
  title?: string;
  onClose: () => void;
}

const EditionFlipbook: React.FC<EditionFlipbookProps> = ({ pdfUrl, onClose }) => {
  return <Pdf3DFlipbook pdfUrl={formatAssetUrl(pdfUrl)} onClose={onClose} />;
};

export default EditionFlipbook;
