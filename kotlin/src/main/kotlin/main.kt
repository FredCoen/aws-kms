import com.amazonaws.encryptionsdk.AwsCrypto
import com.amazonaws.encryptionsdk.CommitmentPolicy
import com.amazonaws.encryptionsdk.jce.JceMasterKey
import javax.crypto.spec.SecretKeySpec
import kotlin.random.Random

fun main(args: Array<String>) {

    val cleartext = "asdfL"
    val keyName = "master"
    val keyNamespace = "orgName"

    val unencryptedMasterKey = SecretKeySpec(Random.nextBytes(32), "AES")

    val keyRing = JceMasterKey.getInstance(unencryptedMasterKey, keyName, keyNamespace, "AES/GCM/NoPadding")

    val crypto = AwsCrypto.builder().withCommitmentPolicy(CommitmentPolicy.RequireEncryptRequireDecrypt).build()

    val encryptionContext: Map<String, String> = mapOf(
        "stage" to "demo",
        "purpose" to "simple demonstration app",
        "origin" to "us-west-2"
    )
    val encryptResult = crypto.encryptData(keyRing, cleartext.toByteArray(), encryptionContext)
    val ciphertext = encryptResult.result

    val decryptResult = crypto.decryptData(keyRing, ciphertext)
    val content = String(decryptResult.result)

    println("cipher text content: $content cleartext: $cleartext")
}
