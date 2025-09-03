import React from "react";
import { CarListingPage } from "../../../components/cars/CarListingPage";
import { unslugify } from "../../../lib/utils";

interface CarsPageProps {
  params: {
    make: string;
  };
}

export default function MakePage({ params }: CarsPageProps) {
  const make = unslugify(params.make);

  return <CarListingPage initialMake={make} />;
}
