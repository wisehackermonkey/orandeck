import { useRedLed } from "../parts/seveibar.red-led.tsx"
import { useTPS74601PDRVR } from "../parts/seveibar.reg-5v-to-3v-C2837407"
import { useResistor, useCapacitor, createUseComponent } from "@tscircuit/core"
import type { CommonLayoutProps } from "@tscircuit/props"

export const Reg5vTo3v3 = (props: { name: string } & CommonLayoutProps) => {
  const PWR1 = useTPS74601PDRVR("PWR1")
  const R6 = useResistor("R6", { resistance: "1M", footprint: "0402" })
  const R7 = useResistor("R7", { resistance: "200k", footprint: "0402" })
  const R8 = useResistor("R8", { resistance: "1k", footprint: "0402" })
  const C6 = useCapacitor("C6", { footprint: "cap0805", capacitance: "10uF" })
  const C7 = useCapacitor("C7", { footprint: "cap0805", capacitance: "10uF" })
  const LED1 = useRedLed("LED1")

  return (
    <group {...props}>
      <PWR1
        pcbX={4}
        pcbRotation="90deg"
        EN="net.v5"
        EP="net.gnd"
        IN="net.v5"
        OUT="net.v3_3"
      />
      <R6 pcbX={7} pcbY={-0.5} pin1={PWR1.OUT} pcbRotation="180deg" schX={-3} />
      <R7 pcbX={6} pcbY={1} pcbRotation="90deg" schX={-3} schY={-2} />
      <R8 pcbRotation="180deg" pcbX={7} pcbY={-3} pin1="net.v3_3" schX={-3} schY={2} />
      <C6 neg="net.gnd" pos="net.v5" schX={3} schY={-1.5} />
      <C7 pcbRotation="180deg" pcbX={0} pcbY={-3} pos="net.v3_3" neg="net.gnd" schX={3} />
      <LED1 pcbX={4} pcbY={-3} neg="net.gnd" pos={R8.pin2} schX={4} schY={3} />

      <trace from={PWR1.FB} to={R6.pin2} />
      <trace from={PWR1.FB} to={R7.pin1} />
      <trace from={R7.pin2} to="net.gnd" />
      <trace from={PWR1.GND} to="net.gnd" />
      <trace from={C7.neg} to="net.gnd" />
      <trace from={C7.pos} to="net.v3_3" />
    </group>
  )
}
