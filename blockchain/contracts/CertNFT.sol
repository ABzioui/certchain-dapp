// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CertNFT
 * @notice Badge NFT ERC-721 représentant un certificat émis via CertChain.
 *         Un token est minté par certificat et assigné au diplômé.
 */
contract CertNFT is ERC721, Ownable {

    uint256 private _nextTokenId;

    struct TokenData {
        bytes32 certId;       // Référence vers CertificateRegistry
        string  ipfsUri;      // URI IPFS des métadonnées NFT (JSON ERC-721)
    }

    /// tokenId => TokenData
    mapping(uint256 => TokenData) private _tokenData;

    /// Adresses autorisées à minter (établissements accrédités)
    mapping(address => bool) private _minters;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event CertNFTMinted(
        uint256 indexed tokenId,
        bytes32 indexed certId,
        address indexed recipient,
        string  ipfsUri
    );

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    // ─── Modifier ────────────────────────────────────────────────────────────────

    modifier onlyMinter() {
        require(_minters[msg.sender] || msg.sender == owner(),
                "CertNFT: not authorized minter");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor() ERC721("CertChain Certificate", "CERT") Ownable(msg.sender) {}

    // ─── Admin ───────────────────────────────────────────────────────────────────

    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "CertNFT: zero address");
        _minters[minter] = true;
        emit MinterAdded(minter);
    }

    function removeMinter(address minter) external onlyOwner {
        _minters[minter] = false;
        emit MinterRemoved(minter);
    }

    // ─── Minting ─────────────────────────────────────────────────────────────────

    /**
     * @notice Minte un badge NFT et l'assigne au diplômé.
     * @param to        Adresse du diplômé (recipient).
     * @param certId    Identifiant du certificat dans CertificateRegistry.
     * @param ipfsUri   URI IPFS des métadonnées (JSON ERC-721 : name, description, image).
     * @return tokenId  Identifiant du token minté.
     */
    function mintCertNFT(
        address to,
        bytes32 certId,
        string calldata ipfsUri
    ) external onlyMinter returns (uint256 tokenId) {
        require(to != address(0),         "CertNFT: zero recipient");
        require(certId != bytes32(0),     "CertNFT: invalid certId");
        require(bytes(ipfsUri).length > 0,"CertNFT: empty URI");

        tokenId = _nextTokenId++;

        _safeMint(to, tokenId);

        _tokenData[tokenId] = TokenData({
            certId:  certId,
            ipfsUri: ipfsUri
        });

        emit CertNFTMinted(tokenId, certId, to, ipfsUri);
    }

    // ─── Lecture ─────────────────────────────────────────────────────────────────

    /**
     * @notice Retourne l'URI des métadonnées d'un token (standard ERC-721).
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_ownerOf(tokenId) != address(0), "CertNFT: token does not exist");
        return _tokenData[tokenId].ipfsUri;
    }

    /**
     * @notice Retourne le certId associé à un token.
     */
    function getCertId(uint256 tokenId) external view returns (bytes32) {
        require(_ownerOf(tokenId) != address(0), "CertNFT: token does not exist");
        return _tokenData[tokenId].certId;
    }

    /**
     * @notice Retourne true si l'adresse est un minter autorisé.
     */
    function isMinter(address addr) external view returns (bool) {
        return _minters[addr] || addr == owner();
    }

    /**
     * @notice Retourne le prochain tokenId qui sera minté.
     */
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }
}
