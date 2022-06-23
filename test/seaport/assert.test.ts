import {validateOrderWithCounter} from "../../src/utils/schemas";
import {erc8001} from "../data/orders";


if (!validateOrderWithCounter(erc8001)) console.log(validateOrderWithCounter.errors)
