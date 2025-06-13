#!/usr/bin/env ruby -w
# frozen_string_literal: true
# encoding: UTF-8
#
# = Color_spec.rb -- The TaskJuggler III Project Management Software
#
# Copyright (c) 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014
#               by Chris Schlaeger <cs@taskjuggler.org>
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of version 2 of the GNU General Public License as
# published by the Free Software Foundation.
#

require 'taskjuggler/Painter/Color'

RSpec.configure do |config|
  config.expect_with(:rspec) { |c| c.syntax = :expect }
end

class TaskJuggler

  class Painter

    describe "Color" do

      it 'should Convert RGB to HSV' do
        expect(Color.new(0, 0, 0).to_hsv).to eq([ 0, 0, 0 ])
        expect(Color.new(255, 0, 0).to_hsv).to eq([ 0, 255, 255 ])
        expect(Color.new(255, 0, 4).to_hsv).to eq([ 359, 255, 255 ])
        expect(Color.new(255, 255, 255).to_hsv).to eq([ 0, 0, 255 ])
        expect(Color.new(60, 125, 116).to_hsv).to eq([ 171, 132, 125 ])
      end

      it 'should convert HSV to RGB' do
        expect(Color.new(0, 0, 0, :hsv).to_rgb).to eq([ 0, 0, 0 ])
        expect(Color.new(0, 0, 255, :hsv).to_rgb).to eq([ 255, 255, 255 ])
        expect(Color.new(150, 0, 255, :hsv).to_rgb).to eq([ 255, 255, 255 ])
        expect(Color.new(93, 156, 121, :hsv).to_rgb).to eq([ 80, 121, 46 ])
        expect(Color.new(275, 87, 94, :hsv).to_rgb).to eq([ 80, 61, 94 ])
        expect(Color.new(335, 47, 223, :hsv).to_rgb).to eq([ 223, 181, 199 ])
      end

      it 'should Convert to HSV and back' do
        0.step(255, 8) do |r|
          0.step(255, 8) do |g|
            0.step(255, 8) do |b|
              rgbRef = [r, g, b]
              hsv = Color.new(r, g, b).to_hsv
              rgb = Color.new(*hsv, :hsv).to_rgb
              3.times do |i|
                # Due to rounding errors, we tolerate a difference of up to 5.
                expect((rgb[i] - rgbRef[i]).abs).to be <= 5
              end
            end
          end
        end
      end

    end

  end

end

