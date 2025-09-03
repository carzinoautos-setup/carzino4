import React from "react";
import { CarListingPage } from "../../../../components/cars/CarListingPage";
import { unslugify } from "../../../../lib/utils";

interface CarsPageProps {
  params: {
    make: string;
    model: string;
  };
}

export default function ModelPage({ params }: CarsPageProps) {
  const make = unslugify(params.make);
  const model = unslugify(params.model);

  return <CarListingPage initialMake={make} initialModel={model} />;
}
