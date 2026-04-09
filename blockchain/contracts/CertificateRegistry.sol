// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CertificateRegistry
 * @notice Contrat principal pour l'émission et la vérification de certificats on-chain.
 *
 * @dev Architecture de révocation à deux niveaux :
 *
 *   1. CertificateRegistry.revokeCertificate()
 *      → Utilisé par l'ÉTABLISSEMENT ÉMETTEUR lui-même.
 *        Ex: erreur de saisie, diplôme annulé par l'école.
 *
 *   2. RevocationList.revoke()
 *      → Utilisé par un TIERS AUTORISÉ (ministère, organisme d'accréditation).
 *        Ex: fraude détectée après coup, sanction disciplinaire externe.
 *
 *      Le frontend doit interroger LES DEUX contrats pour afficher le vrai statut :
 *        statut final = registry.revoked OR revocationList.isRevoked(certId)
 */
contract CertificateRegistry is Ownable {

    // ─── Structures ────────────────────────────────────────────────────────────

    struct Certificate {
        bytes32  certHash;       // SHA-256 des données du certificat
        address  issuer;         // Adresse Ethereum de l'établissement émetteur
        uint256  issuedAt;       // Timestamp d'émission (block.timestamp)
        bool     revoked;        // Révoqué par l'émetteur
        uint256  nftTokenId;     // Token ID ERC-721 associé (0 = non lié)
        string   ipfsHash;       // Hash IPFS des métadonnées complètes
    }

    // ─── Storage ────────────────────────────────────────────────────────────────

    /// certId => Certificate
    mapping(bytes32 => Certificate) private _certificates;

    /// Établissements accrédités (adresse => autorisé)
    mapping(address => bool) private _accreditedIssuers;

    // ─── Events ─────────────────────────────────────────────────────────────────

    event CertificateIssued(
        bytes32 indexed certId,
        bytes32 indexed certHash,
        address indexed issuer,
        uint256 issuedAt,
        string  ipfsHash
    );

    event CertificateRevoked(
        bytes32 indexed certId,
        address indexed revokedBy,
        uint256 revokedAt
    );

    event IssuerAccredited(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    event NFTLinked(bytes32 indexed certId, uint256 tokenId);

    // ─── Modifiers ───────────────────────────────────────────────────────────────

    modifier onlyAccredited() {
        require(_accreditedIssuers[msg.sender], "CertificateRegistry: not accredited");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── Admin : gestion des émetteurs ───────────────────────────────────────────

    /**
     * @notice Accrédite un établissement émetteur.
     */
    function accreditIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "CertificateRegistry: zero address");
        _accreditedIssuers[issuer] = true;
        emit IssuerAccredited(issuer);
    }

    /**
     * @notice Retire l'accréditation d'un établissement.
     */
    function revokeIssuerAccreditation(address issuer) external onlyOwner {
        _accreditedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }

    // ─── Émission ────────────────────────────────────────────────────────────────

    /**
     * @notice Émet un nouveau certificat.
     * @param certHash  Hash SHA-256 des données du certificat (calculé hors chaîne).
     * @param ipfsHash  Hash IPFS des métadonnées complètes.
     * @return certId   Identifiant unique du certificat on-chain.
     */
    function issueCertificate(
        bytes32 certHash,
        string calldata ipfsHash
    ) external onlyAccredited returns (bytes32 certId) {
        certId = keccak256(abi.encodePacked(certHash, msg.sender, block.timestamp));

        require(
            _certificates[certId].issuedAt == 0,
            "CertificateRegistry: cert already exists"
        );

        _certificates[certId] = Certificate({
            certHash:   certHash,
            issuer:     msg.sender,
            issuedAt:   block.timestamp,
            revoked:    false,
            nftTokenId: 0,
            ipfsHash:   ipfsHash
        });

        emit CertificateIssued(certId, certHash, msg.sender, block.timestamp, ipfsHash);
    }

    // ─── Révocation niveau 1 (par l'émetteur) ────────────────────────────────────

    /**
     * @notice Révoque un certificat.
     *         Réservé à l'émetteur original ou à l'owner (admin).
     *         Pour une révocation externe (tiers), utiliser RevocationList.
     */
    function revokeCertificate(bytes32 certId) external {
        Certificate storage cert = _certificates[certId];
        require(cert.issuedAt != 0,   "CertificateRegistry: cert not found");
        require(!cert.revoked,        "CertificateRegistry: already revoked");
        require(
            cert.issuer == msg.sender || owner() == msg.sender,
            "CertificateRegistry: not authorized"
        );

        cert.revoked = true;
        emit CertificateRevoked(certId, msg.sender, block.timestamp);
    }

    // ─── Lien NFT ────────────────────────────────────────────────────────────────

    /**
     * @notice Associe un Token ID NFT à un certificat.
     *         Appelé par l'émetteur après le mint dans CertNFT.
     */
    function linkNFT(bytes32 certId, uint256 tokenId) external {
        Certificate storage cert = _certificates[certId];
        require(cert.issuedAt != 0, "CertificateRegistry: cert not found");
        require(
            cert.issuer == msg.sender || owner() == msg.sender,
            "CertificateRegistry: not authorized"
        );
        cert.nftTokenId = tokenId;
        emit NFTLinked(certId, tokenId);
    }

    // ─── Lecture ─────────────────────────────────────────────────────────────────

    /**
     * @notice Retourne les informations d'un certificat.
     * @dev Le statut "révoqué" retourné ici ne reflète que la révocation
     *      par l'émetteur. Interroger aussi RevocationList pour le statut complet.
     */
    function getCertificate(bytes32 certId)
        external
        view
        returns (
            bytes32 certHash,
            address issuer,
            uint256 issuedAt,
            bool    revoked,
            uint256 nftTokenId,
            string  memory ipfsHash
        )
    {
        Certificate storage cert = _certificates[certId];
        require(cert.issuedAt != 0, "CertificateRegistry: cert not found");
        return (
            cert.certHash,
            cert.issuer,
            cert.issuedAt,
            cert.revoked,
            cert.nftTokenId,
            cert.ipfsHash
        );
    }

    /**
     * @notice Retourne true si l'adresse est un émetteur accrédité.
     */
    function isAccredited(address issuer) external view returns (bool) {
        return _accreditedIssuers[issuer];
    }
}
