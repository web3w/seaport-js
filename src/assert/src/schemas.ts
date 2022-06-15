import * as addressSchema from '../schemas/base/address_schema.json';
import * as blockParamSchema from '../schemas/block_param_schema.json';
import * as callDataSchema from '../schemas/base/call_data_schema.json';
import * as ecSignatureParameterSchema from '../schemas/sign/ec_signature_parameter_schema.json';
import * as ecSignatureSchema from '../schemas/sign/ec_signature_schema.json';
import * as eip712DomainSchema from '../schemas/sign/eip712_domain_schema.json';
import * as eip712TypedDataSchema from '../schemas/sign/eip712_typed_data_schema.json';
import * as hexSchema from '../schemas/base/hex_schema.json';
import * as jsNumber from '../schemas/base/js_number_schema.json';
import * as numberSchema from '../schemas/base/number_schema.json';
import * as orderHashSchema from '../schemas/base/order_hash_schema.json';
import * as orderSchema from '../schemas/order_schema.json';
import * as ordersSchema from '../schemas/orders_schema.json';
import * as signedOrderSchema from '../schemas/signed_order_schema.json';
import * as signedOrdersSchema from '../schemas/signed_orders_schema.json';
import * as tokenSchema from '../schemas/token_schema.json';
import * as txDataSchema from '../schemas/tx_data_schema.json';
import * as wholeNumberSchema from '../schemas/base/whole_number_schema.json';
import metadataSchema from '../schemas/base/metadata_schema.json';


export const schemas = {
    numberSchema,
    addressSchema,
    callDataSchema,
    hexSchema,
    ecSignatureParameterSchema,
    ecSignatureSchema,
    eip712DomainSchema,
    eip712TypedDataSchema,
    orderHashSchema,
    orderSchema,
    signedOrderSchema,
    signedOrdersSchema,
    ordersSchema,
    blockParamSchema,
    tokenSchema,
    jsNumber,
    txDataSchema,
    wholeNumberSchema,
    metadataSchema
};
