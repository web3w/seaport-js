import {seaportAssert} from "../../src/utils/assert";
import {erc8001} from "../data/orders";


if (!seaportAssert.validateOrderWithCounter(erc8001)) console.log(seaportAssert.validateOrderWithCounter.errors)
