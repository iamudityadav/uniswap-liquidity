// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./interfaces/IERC20.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IUniswapV2Router01.sol";

contract UniswapLiquidity {
    address private constant UNISWAP_V2_FACTORY = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    address private constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    event Log(string message, uint256 value);

    function addLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 _amountA,
        uint256 _amountB
    ) external {
        IERC20(_tokenA).transferFrom(msg.sender, address(this), _amountA);
        IERC20(_tokenB).transferFrom(msg.sender, address(this), _amountB);

        IERC20(_tokenA).approve(UNISWAP_V2_ROUTER, _amountA);
        IERC20(_tokenB).approve(UNISWAP_V2_ROUTER, _amountB);

        (uint256 amountA, uint256 amountB, uint256 liquidity_tokens) = IUniswapV2Router01(UNISWAP_V2_ROUTER).addLiquidity(
            _tokenA, 
            _tokenB, 
            _amountA, 
            _amountB, 
            1, 
            1, 
            address(this),
            block.timestamp
        );

        emit Log("amountA", amountA);
        emit Log("amountB", amountB);
        emit Log("liquidity tokens", liquidity_tokens);
    }

    function removeLiquidity(address _tokenA, address _tokenB) external {
        address liquidity_pool = IUniswapV2Factory(UNISWAP_V2_FACTORY).getPair(_tokenA, _tokenB);

        uint256 liquidity_tokens = IERC20(liquidity_pool).balanceOf(address(this));

        IERC20(liquidity_pool).approve(UNISWAP_V2_ROUTER, liquidity_tokens);

        (uint256 amountA, uint256 amountB) = IUniswapV2Router01(UNISWAP_V2_ROUTER).removeLiquidity(
            _tokenA,
            _tokenB,
            liquidity_tokens,
            1,
            1,
            address(this),
            block.timestamp
        );

        emit Log("amountA", amountA);
        emit Log("amountB", amountB);
    }
}