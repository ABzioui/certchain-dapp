// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RevocationList
 * @notice Registre autonome de révocation. Peut fonctionner indépendamment
 *         ou en complément du CertificateRegistry.
 */
contract RevocationList is Ownable {

    struct RevocationEntry {
        address  revokedBy;   // Qui a révoqué
        uint256  revokedAt;   // Quand (timestamp)
        string   reason;      // Motif (optionnel)
    }

    /// certId => RevocationEntry (non vide = révoqué)
    mapping(bytes32 => RevocationEntry) private _revocations;

    /// Adresses autorisées à révoquer
    mapping(address => bool) private _authorizedRevokers;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event Revoked(
        bytes32 indexed certId,
        address indexed revokedBy,
        uint256 revokedAt,
        string  reason
    );

    event RevokerAdded(address indexed revoker);
    event RevokerRemoved(address indexed revoker);

    // ─── Modifier ────────────────────────────────────────────────────────────────

    modifier onlyRevoker() {
        require(
            _authorizedRevokers[msg.sender] || msg.sender == owner(),
            "RevocationList: not authorized"
        );
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── Admin ───────────────────────────────────────────────────────────────────

    function addRevoker(address revoker) external onlyOwner {
        require(revoker != address(0), "RevocationList: zero address");
        _authorizedRevokers[revoker] = true;
        emit RevokerAdded(revoker);
    }

    function removeRevoker(address revoker) external onlyOwner {
        _authorizedRevokers[revoker] = false;
        emit RevokerRemoved(revoker);
    }

    // ─── Révocation ──────────────────────────────────────────────────────────────

    /**
     * @notice Révoque un certificat avec un motif optionnel.
     * @param certId  Identifiant du certificat (même que CertificateRegistry).
     * @param reason  Motif de révocation (peut être vide).
     */
    function revoke(bytes32 certId, string calldata reason) external onlyRevoker {
        require(!isRevoked(certId), "RevocationList: already revoked");

        _revocations[certId] = RevocationEntry({
            revokedBy: msg.sender,
            revokedAt: block.timestamp,
            reason:    reason
        });

        emit Revoked(certId, msg.sender, block.timestamp, reason);
    }

    // ─── Lecture ─────────────────────────────────────────────────────────────────

    /**
     * @notice Retourne true si le certificat est révoqué.
     */
    function isRevoked(bytes32 certId) public view returns (bool) {
        return _revocations[certId].revokedAt != 0;
    }

    /**
     * @notice Retourne les détails de la révocation (ou zéros si non révoqué).
     */
    function getRevocationInfo(bytes32 certId)
        external
        view
        returns (
            address revokedBy,
            uint256 revokedAt,
            string memory reason
        )
    {
        RevocationEntry storage entry = _revocations[certId];
        return (entry.revokedBy, entry.revokedAt, entry.reason);
    }

    /**
     * @notice Retourne true si l'adresse est autorisée à révoquer.
     */
    function isAuthorizedRevoker(address addr) external view returns (bool) {
        return _authorizedRevokers[addr] || addr == owner();
    }
}
