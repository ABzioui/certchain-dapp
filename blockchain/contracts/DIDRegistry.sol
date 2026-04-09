// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DIDRegistry
 * @notice Registre de DID (Decentralized Identifiers) liés aux adresses Ethereum.
 *         Format : did:ethr:0x<adresse_ethereum>
 *
 *         Chaque adresse Ethereum est automatiquement un DID valide.
 *         Ce contrat permet d'enrichir le DID avec des métadonnées : nom de
 *         l'établissement, document DID (JSON IPFS), et statut actif/inactif.
 */
contract DIDRegistry {

    struct DIDDocument {
        string  name;           // Nom lisible (ex: "Université Paris-Saclay")
        string  ipfsDocHash;    // Hash IPFS du document DID complet (JSON-LD)
        bool    active;         // false = révoqué / désactivé
        uint256 registeredAt;   // Timestamp d'enregistrement
        uint256 updatedAt;      // Dernier horodatage de mise à jour
    }

    /// adresse => DIDDocument
    mapping(address => DIDDocument) private _didDocuments;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event DIDRegistered(
        address indexed subject,
        string  name,
        string  ipfsDocHash,
        uint256 registeredAt
    );

    event DIDUpdated(
        address indexed subject,
        string  name,
        string  ipfsDocHash,
        uint256 updatedAt
    );

    event DIDDeactivated(address indexed subject, uint256 deactivatedAt);

    // ─── Enregistrement / mise à jour ────────────────────────────────────────────

    /**
     * @notice Enregistre ou met à jour le DID de l'appelant.
     * @param name          Nom lisible de l'entité.
     * @param ipfsDocHash   Hash IPFS du document DID (JSON-LD complet).
     */
    function registerDID(
        string calldata name,
        string calldata ipfsDocHash
    ) external {
        require(bytes(name).length > 0, "DIDRegistry: name required");

        DIDDocument storage doc = _didDocuments[msg.sender];

        if (doc.registeredAt == 0) {
            // Première inscription
            doc.registeredAt = block.timestamp;
            doc.active = true;
            emit DIDRegistered(msg.sender, name, ipfsDocHash, block.timestamp);
        } else {
            emit DIDUpdated(msg.sender, name, ipfsDocHash, block.timestamp);
        }

        doc.name        = name;
        doc.ipfsDocHash = ipfsDocHash;
        doc.updatedAt   = block.timestamp;
    }

    /**
     * @notice Désactive le DID de l'appelant (irréversible depuis ce contrat).
     */
    function deactivateDID() external {
        DIDDocument storage doc = _didDocuments[msg.sender];
        require(doc.registeredAt != 0, "DIDRegistry: DID not found");
        require(doc.active,            "DIDRegistry: already deactivated");

        doc.active    = false;
        doc.updatedAt = block.timestamp;

        emit DIDDeactivated(msg.sender, block.timestamp);
    }

    // ─── Lecture ─────────────────────────────────────────────────────────────────

    /**
     * @notice Résout un DID depuis une adresse Ethereum.
     */
    function resolveDID(address subject)
        external
        view
        returns (
            string memory name,
            string memory ipfsDocHash,
            bool   active,
            uint256 registeredAt,
            uint256 updatedAt
        )
    {
        DIDDocument storage doc = _didDocuments[subject];
        require(doc.registeredAt != 0, "DIDRegistry: DID not found");
        return (doc.name, doc.ipfsDocHash, doc.active, doc.registeredAt, doc.updatedAt);
    }

    /**
     * @notice Retourne true si le sujet a un DID enregistré et actif.
     */
    function isActiveDID(address subject) external view returns (bool) {
        DIDDocument storage doc = _didDocuments[subject];
        return doc.registeredAt != 0 && doc.active;
    }

    /**
     * @notice Retourne le DID URI au format standard did:ethr:.
     */
    function getDIDUri(address subject) external pure returns (string memory) {
        return string(abi.encodePacked(
            "did:ethr:0x",
            _toHexString(uint160(subject), 20)
        ));
    }

    // ─── Utilitaire interne ───────────────────────────────────────────────────────

    function _toHexString(uint256 value, uint256 length)
        internal
        pure
        returns (string memory)
    {
        bytes memory buffer = new bytes(2 * length);
        bytes16 hexChars = "0123456789abcdef";
        for (uint256 i = 2 * length; i > 0; i--) {
            buffer[i - 1] = hexChars[value & 0xf];
            value >>= 4;
        }
        return string(buffer);
    }
}
