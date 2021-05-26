

import {
  RawAesKeyringNode,
  buildClient,
  CommitmentPolicy,
  RawAesWrappingSuiteIdentifier,
} from '@aws-crypto/client-node'
import { randomBytes } from 'crypto'

// A commitment policy is a configuration setting that determines whether your application encrypts and decrypts with key commitment
// The AWS Encryption SDK supports key commitment (sometimes known as robustness), a security property that guarantees that each ciphertext can be decrypted only to a single plaintext.
/* This builds the client with the REQUIRE_ENCRYPT_REQUIRE_DECRYPT commitment policy,
  * which enforces that this client only encrypts using committing algorithm suites
  * and enforces that this client
  * will only decrypt encrypted messages
  * that were created with a committing algorithm suite.
  * This is the default commitment policy
  * if you build the client with `buildClient()`.
  */
const { encrypt, decrypt } = buildClient(
  CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT
)


//RawAesKeyringNode encrypt /decrypt example



async function aesTest() {
  /* You need to specify a name
    * and a namespace for raw encryption key providers.
    * The name and namespace that you use in the decryption keyring *must* be an exact,
    * *case-sensitive* match for the name and namespace in the encryption keyring.
    */
  const keyName = 'master'
  const keyNamespace = 'orgName'

  /* The wrapping suite defines the AES-GCM algorithm suite to use. */
  const wrappingSuite =
    RawAesWrappingSuiteIdentifier.AES256_GCM_IV12_TAG16_NO_PADDING

  // Wrapping key
  const unencryptedMasterKey = randomBytes(32)
  console.log("plain key used:", unencryptedMasterKey)

  /* Configure the Raw AES keyring. */
    // The sdk uses envelope encryption meaning that a wrapping key encrypts the data key which in plain form encrypts the content
    // keyring or master key provider specifies the wrapping keys that the AWS Encryption SDK uses to protect your data keys
  const keyring = new RawAesKeyringNode({
    keyName,
    keyNamespace,
    unencryptedMasterKey,
    wrappingSuite,
  })

  // added layer of security (add relevant metadata) to assert things about the encrypted data
  const context = {
    stage: 'demo',
    purpose: 'simple demonstration app',
    origin: 'us-west-2',
  }

  // content
  const cleartext = 'asdfL'

  /* Encrypt the data. */
  // The encryption method uses the plaintext data key to encrypt the data, and then discards the plaintext data key. If you provided an encryption context, the encryption method also cryptographically binds the encryption context to the encrypted data.
  const { result } = await encrypt(keyring, cleartext, {
    encryptionContext: context,
  })
  /* Decrypt the data. */
  const { plaintext, messageHeader } = await decrypt(keyring, result)

  /* Grab the encryption context so you can verify it. */
  const { encryptionContext } = messageHeader


  Object.entries(context).forEach(([key, value]) => {
    if (encryptionContext[key] !== value)
      throw new Error('Encryption Context does not match expected values')
  })

  /* Return the values so the code can be tested. */
  console.log("decrypted",plaintext.toString())
  console.log("encrypted",result)
  console.log("original",cleartext)
}

aesTest()
